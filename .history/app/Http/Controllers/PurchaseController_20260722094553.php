<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\PurchaseDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\StorePurchaseRequest;
use App\Http\Requests\UpdatePurchaseRequest;
use Exception;

class PurchaseController extends Controller
{
    // Get all purchases
    public function index(Request $request)
    {
        $keyword = $request->search;
        $status = $request->status;

        $purchases = Purchase::query()
            ->with(['supplier', 'user'])
            ->when($keyword, function ($query) use ($keyword) {
                $query->whereHas('supplier', function ($q) use ($keyword) {
                    $q->where('supplier_name', 'like', "%{$keyword}%");
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
            'total'        => (int) $counts->total,
            'pending'      => (int) $counts->pending,
            'received'     => (int) $counts->received,
            'cancelled'    => (int) $counts->cancelled,
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
            $needsGeneratedCode

            unset($validated['details']);

            // total_amount is now calculated by trg_purchase_total in Oracle
            $purchase = Purchase::create($validated);

            foreach ($details as $item) {
                PurchaseDetail::create([
                    'purchase_id' => $purchase->purchase_id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                ]);
            }

            DB::commit();

            // refresh so we return the trigger-calculated total_amount, not a stale value
            $purchase->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Purchase created successfully.',
                'data' => $purchase->load('details.product', 'supplier', 'user')
            ], 201);
        } catch (Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
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
        DB::beginTransaction();

        try {

            $validated = $request->validated();
            $details = $validated['details'] ?? null;
            unset($validated['details']);

            if ($details !== null) {

                $purchase->details()->delete(); // trigger fires on DELETE, recalculates (likely to 0 momentarily)

                foreach ($details as $item) {
                    PurchaseDetail::create([
                        'purchase_id' => $purchase->purchase_id,
                        'product_id' => $item['product_id'],
                        'quantity' => $item['quantity'],
                        'unit_cost' => $item['unit_cost'],
                    ]);
                }
            }

            $purchase->update($validated); // no total_amount here anymore

            DB::commit();

            $purchase->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Purchase updated successfully.',
                'data' => $purchase->load('details.product', 'supplier', 'user')
            ]);
        } catch (Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Delete purchase (details cascade via FK)
    public function destroy(Purchase $purchase)
    {
        try {

            $purchase->delete();

            return response()->json([
                'success' => true,
                'message' => 'Purchase deleted successfully.'
            ]);
        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
