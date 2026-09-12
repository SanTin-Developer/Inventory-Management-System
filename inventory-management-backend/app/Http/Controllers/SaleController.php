<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSaleRequest;
use App\Http\Requests\UpdateSaleRequest;
use App\Models\Sale;
use App\Models\SaleDetail;
use App\Services\CommissionService;
use App\Services\InventoryService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    public function __construct(
        private readonly CommissionService $commissionService,
        private readonly InventoryService $inventory
    ) {}

    // Get all sales
    public function index(Request $request)
    {
        $keyword = $request->search;
        $status = $request->status;
        $payment = $request->payment_method;

        $sales = Sale::query()
            ->with(['customer', 'user'])
            ->when($keyword, function ($query) use ($keyword) {
                $needle = '%'.$this->escapeLike($keyword).'%';
                $query->where(function ($q) use ($needle) {
                    $q->where('customer_name', 'like', $needle)
                        ->orWhereHas('customer', function ($sub) use ($needle) {
                            $sub->where('customer_name', 'like', $needle);
                        });
                });
            })
            ->when($status, function ($query) use ($status) {
                $query->where('status', $status);
            })
            ->when($payment, function ($query) use ($payment) {
                $query->where('payment_method', $payment);
            })
            ->orderBy('sale_id', 'desc')
            ->paginate($request->input('per_page', 10));

        return response()->json($sales);
    }

    // Create sale with line items
    public function store(StoreSaleRequest $request)
    {
        DB::beginTransaction();

        try {

            $validated = $request->validated();
            $details = $validated['details'];
            unset($validated['details'], $validated['sale_code']);

            $validated['sale_code'] = 'TMP-'.uniqid();

            // Compute total_amount from line items — DB column is NOT NULL
            $subtotal = collect($details)->sum(
                fn ($item) => $item['quantity'] * $item['unit_price']
            );

            $discount = $validated['discount_amount'] ?? 0;
            $validated['total_amount'] = $subtotal - $discount;

            $sale = Sale::create($validated);

            $sale->sale_code = $this->generateUniqueSaleCode();
            $sale->save();

            foreach ($details as $item) {
                SaleDetail::create([
                    'sale_id' => $sale->sale_id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $item['quantity'] * $item['unit_price'],
                ]);
            }

            // Goods leave the warehouse only when the sale is Completed.
            // Throws (and rolls back) if any product lacks stock.
            if ($sale->status === 'Completed') {
                $this->inventory->ship($details);
            }

            DB::commit();
            $sale->refresh();

            if ($sale->status === 'Completed') {
                try {
                    $this->commissionService->calculateForSale($sale->sale_id);
                } catch (Exception $e) {
                    \Log::error('Commission calculation failed for sale '.$sale->sale_id.': '.$e->getMessage());
                    // don't rethrow — sale was already saved successfully
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Sale created successfully.',
                'data' => $sale->load('details.product', 'customer', 'user'),
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $this->friendlyErrorMessage($e, 'Sale store'),
            ], 500);
        }
    }

    private function generateUniqueSaleCode(): string
    {
        do {
            $code = 'SL-'.random_int(10000, 99999);
        } while (Sale::where('sale_code', $code)->exists());

        return $code;
    }

    public function stats()
    {
        $counts = DB::table('vw_sales_summary')
            ->selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled,
            SUM(CASE WHEN status = 'Refunded' THEN 1 ELSE 0 END) as refunded,
            SUM(total_amount) as total_amount
        ")
            ->first();

        return response()->json([
            'total' => (int) $counts->total,
            'completed' => (int) $counts->completed,
            'pending' => (int) $counts->pending,
            'cancelled' => (int) $counts->cancelled,
            'refunded' => (int) $counts->refunded,
            'total_amount' => (float) $counts->total_amount,
        ]);
    }

    // Show sale
    public function show(Sale $sale)
    {
        return response()->json(
            $sale->load('details.product', 'customer', 'user')
        );
    }

    // Update sale (header, optionally replaces line items)
    public function update(UpdateSaleRequest $request, Sale $sale)
    {
        // Captured BEFORE the update — this is what lets us detect the
        // transition into 'Completed' rather than firing on every save, and
        // reconcile stock from the original state to the new state.
        $oldStatus = $sale->status;
        $oldDetails = $sale->details()->get(['product_id', 'quantity'])->toArray();

        DB::beginTransaction();

        try {

            $validated = $request->validated();
            $details = $validated['details'] ?? null;
            unset($validated['details']);

            if ($details !== null) {

                $sale->details()->delete();

                foreach ($details as $item) {
                    SaleDetail::create([
                        'sale_id' => $sale->sale_id,
                        'product_id' => $item['product_id'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'subtotal' => $item['quantity'] * $item['unit_price'],
                    ]);
                }
            }

            $sale->update($validated);

            // Reconcile stock: a completed sale moved goods out — undo that
            // for the old items, then apply the new state.
            if ($oldStatus === 'Completed') {
                $this->inventory->returnStock($oldDetails);
            }

            if ($sale->status === 'Completed') {
                $this->inventory->ship($details ?? $oldDetails);
            }

            DB::commit();

            $sale->refresh();

            // Only trigger commission calculation on the transition INTO
            // 'Completed' — not on every subsequent edit to an already
            // completed sale (CommissionService also guards against
            // duplicates independently, as a second safety net).
            if ($oldStatus !== 'Completed' && $sale->status === 'Completed') {
                $this->commissionService->calculateForSale($sale->sale_id);
            }

            return response()->json([
                'success' => true,
                'message' => 'Sale updated successfully.',
                'data' => $sale->load('details.product', 'customer', 'user'),
            ]);
        } catch (Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $this->friendlyErrorMessage($e, 'Sale update'),
            ], 500);
        }
    }

    // Delete sale (details cascade via FK)
    public function destroy(Sale $sale)
    {
        DB::beginTransaction();

        try {

            // A completed sale already shipped goods — return them before the
            // detail rows cascade away with the parent.
            if ($sale->status === 'Completed') {
                $this->inventory->returnStock(
                    $sale->details()->get(['product_id', 'quantity'])->toArray()
                );
            }

            $sale->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Sale deleted successfully.',
            ]);
        } catch (Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $this->friendlyErrorMessage($e, 'Sale delete'),
            ], 500);
        }
    }
}
