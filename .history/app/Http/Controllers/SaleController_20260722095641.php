<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\StoreSaleRequest;
use App\Http\Requests\UpdateSaleRequest;
use App\Services\CommissionService;
use Exception;

class SaleController extends Controller
{
    public function __construct(
        private readonly CommissionService $commissionService
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
                $query->where(function ($q) use ($keyword) {
                    $q->where('customer_name', 'like', "%{$keyword}%")
                        ->orWhereHas('customer', function ($sub) use ($keyword) {
                            $sub->where('customer_name', 'like', "%{$keyword}%");
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
            unset($validated['details'], $validated['']);

            // Compute total_amount from line items — DB column is NOT NULL
            $subtotal = collect($details)->sum(
                fn($item) => $item['quantity'] * $item['unit_price']
            );

            $discount = $validated['discount_amount'] ?? 0;
            $validated['total_amount'] = $subtotal - $discount;

            $sale = Sale::create($validated);

            foreach ($details as $item) {
                SaleDetail::create([
                    'sale_id' => $sale->sale_id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                ]);
            }

            DB::commit();
            $sale->refresh();

            if ($sale->status === 'Completed') {
                try {
                    $this->commissionService->calculateForSale($sale->sale_id);
                } catch (Exception $e) {
                    \Log::error('Commission calculation failed for sale ' . $sale->sale_id . ': ' . $e->getMessage());
                    // don't rethrow — sale was already saved successfully
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Sale created successfully.',
                'data' => $sale->load('details.product', 'customer', 'user')
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            \Log::error('Sale creation failed', [
                'message' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => $this->friendlyErrorMessage($e)
            ], 500);
        }
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
            'total'        => (int) $counts->total,
            'completed'    => (int) $counts->completed,
            'pending'      => (int) $counts->pending,
            'cancelled'    => (int) $counts->cancelled,
            'refunded'     => (int) $counts->refunded,
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
        // transition into 'Completed' rather than firing on every save.
        $oldStatus = $sale->status;

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
                    ]);
                }
            }

            $sale->update($validated);

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
                'data' => $sale->load('details.product', 'customer', 'user')
            ]);
        } catch (Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Delete sale (details cascade via FK)
    public function destroy(Sale $sale)
    {
        try {

            $sale->delete();

            return response()->json([
                'success' => true,
                'message' => 'Sale deleted successfully.'
            ]);
        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Convert raw DB/Oracle exception messages into a user-friendly message.
     */
    private function friendlyErrorMessage(Exception $e): string
    {
        $raw = $e->getMessage();

        // Oracle trigger: negative stock
        if (str_contains($raw, 'Stock cannot be negative') || str_contains($raw, 'TRG_PREVENT_NEGATIVE_STOCK')) {
            return 'One or more products don\'t have enough stock for this sale. Please check the quantity and try again.';
        }

        // Oracle: foreign key violation (e.g. invalid product/customer id)
        if (str_contains($raw, 'ORA-02291') || str_contains($raw, 'integrity constraint')) {
            return 'One of the selected items no longer exists. Please refresh and try again.';
        }

        // Oracle: unique constraint violation
        if (str_contains($raw, 'ORA-00001') || str_contains($raw, 'unique constraint')) {
            return 'This record already exists.';
        }

        // Fallback for any other Oracle-specific error (ORA-xxxxx)
        if (preg_match('/ORA-\d{5}/', $raw)) {
            return 'Something went wrong while saving. Please check your input and try again.';
        }

        // Non-Oracle / unexpected error — safe generic fallback
        return 'Something went wrong. Please try again.';
    }
}
