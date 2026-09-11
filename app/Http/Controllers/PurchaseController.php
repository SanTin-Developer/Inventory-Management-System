<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchaseRequest;
use App\Http\Requests\UpdatePurchaseRequest;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Services\InventoryService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventory
    ) {}

    // Get all purchases
    public function index(Request $request)
    {
        $keyword = $request->search;
        $status = $request->status;

        $purchases = Purchase::query()
            ->with(['supplier', 'user', 'details.product'])
            ->when($keyword, function ($query) use ($keyword) {
                $needle = '%'.$this->escapeLike($keyword).'%';
                $query->whereHas('supplier', function ($q) use ($needle) {
                    $q->where('supplier_name', 'like', $needle);
                });
            })
            ->when($status, function ($query) use ($status) {
                $query->where('status', $status);
            })
            ->orderBy('purchase_id', 'desc')
            ->paginate($request->input('per_page', 10));

        return response()->json($purchases);
    }

    // Stats Card
    public function stats()
    {
        $counts = DB::table('vw_purchase_summary')
            ->selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'Received' THEN 1 ELSE 0 END) as received,
            SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled,
            SUM(total_amount) as total_amount
        ")
            ->first();

        return response()->json([
            'total' => (int) $counts->total,
            'pending' => (int) $counts->pending,
            'received' => (int) $counts->received,
            'cancelled' => (int) $counts->cancelled,
            'total_amount' => (float) $counts->total_amount,
        ]);
    }

    // Create purchase with line items
    public function store(StorePurchaseRequest $request)
    {
        DB::beginTransaction();

        try {

            $validated = $request->validated();
            $details = $validated['details'];
            unset($validated['details'], $validated['purchase_code']); // never trust client-supplied code

            // temp placeholder to satisfy NOT NULL / UNIQUE until we know the real purchase_id
            $validated['purchase_code'] = 'TMP-'.uniqid();

            // total_amount is calculated by trg_purchase_total in PostgreSQL
            $purchase = Purchase::create($validated);

            // now that purchase_id exists, set the real random code
            $purchase->purchase_code = $this->generateUniquePurchaseCode();
            $purchase->save();

            foreach ($details as $item) {
                PurchaseDetail::create([
                    'purchase_id' => $purchase->purchase_id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'subtotal' => $item['quantity'] * $item['unit_cost'],
                ]);
            }

            // Stock only enters the warehouse once the purchase is Received.
            if (($validated['status'] ?? null) === 'Received') {
                $this->inventory->receive($details);
            }

            DB::commit();

            $purchase->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Purchase created successfully.',
                'data' => $purchase->load('details.product', 'supplier', 'user'),
            ], 201);
        } catch (Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $this->friendlyErrorMessage($e, 'Purchase store'),
            ], 500);
        }
    }

    private function generateUniquePurchaseCode(): string
    {
        do {
            $code = 'PC-'.random_int(10000, 99999);
        } while (Purchase::where('purchase_code', $code)->exists());

        return $code;
    }

    // Show purchase
    public function show(Purchase $purchase)
    {
        return response()->json(
            $purchase->load('details.product', 'supplier', 'user')
        );
    }

    // Update purchase (header, optionally replaces line items)
    public function update(UpdatePurchaseRequest $request, Purchase $purchase)
    {
        // Captured BEFORE any change so stock can be reconciled from the
        // original state to the new state inside the transaction.
        $wasReceived = $purchase->status === 'Received';
        $oldDetails = $purchase->details()->get(['product_id', 'quantity'])->toArray();

        DB::beginTransaction();

        try {

            $validated = $request->validated();
            $details = $validated['details'] ?? null;
            unset($validated['details']);

            if ($details !== null) {

                $purchase->details()->delete();

                foreach ($details as $item) {
                    PurchaseDetail::create([
                        'purchase_id' => $purchase->purchase_id,
                        'product_id' => $item['product_id'],
                        'quantity' => $item['quantity'],
                        'unit_cost' => $item['unit_cost'],
                        'subtotal' => $item['quantity'] * $item['unit_cost'],
                    ]);
                }
            }

            $purchase->update($validated); // no total_amount here anymore

            // Reconcile stock: undo the old receipt, apply the new one.
            $isReceived = $purchase->status === 'Received';

            if ($wasReceived) {
                $this->inventory->reverseReceipt($oldDetails);
            }

            if ($isReceived) {
                $receivedItems = $details ?? $oldDetails;
                $this->inventory->receive($receivedItems);
            }

            DB::commit();

            $purchase->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Purchase updated successfully.',
                'data' => $purchase->load('details.product', 'supplier', 'user'),
            ]);
        } catch (Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $this->friendlyErrorMessage($e, 'Purchase update'),
            ], 500);
        }
    }

    // Delete purchase (details cascade via FK)
    public function destroy(Purchase $purchase)
    {
        DB::beginTransaction();

        try {

            // Return already-received stock to the products first, then the
            // detail rows cascade away with the parent.
            if ($purchase->status === 'Received') {
                $this->inventory->reverseReceipt(
                    $purchase->details()->get(['product_id', 'quantity'])->toArray()
                );
            }

            $purchase->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Purchase deleted successfully.',
            ]);
        } catch (Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $this->friendlyErrorMessage($e, 'Purchase delete'),
            ], 500);
        }
    }
}
