<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\StoreSaleRequest;
use App\Http\Requests\UpdateSaleRequest;
use Exception;

class SaleController extends Controller
{
    // Get all sales
    public function index(Request $request)
    {
        $keyword = $request->keyword;
        $status = $request->status;

        $sales = Sale::query()
            ->with('user')
            ->when($keyword, function ($query) use ($keyword) {
                $query->where('customer_name', 'like', "%{$keyword}%");
            })
            ->when($status, function ($query) use ($status) {
                $query->where('status', $status);
            })
            ->orderBy('sale_id', 'desc')
            ->paginate(10);

        return response()->json($sales);
    }

    // Create sale with line items
    public function store(StoreSaleRequest $request)
    {
        DB::beginTransaction();

        try {

            $validated = $request->validated();
            $details = $validated['details'];
            unset($validated['details']);

            // total_amount left out here on purpose — see note below
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

            return response()->json([
                'success' => true,
                'message' => 'Sale created successfully.',
                'data' => $sale->load('details.product', 'user')
            ], 201);
        } catch (Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
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
            $sale->load('details.product', 'user')
        );
    }

    // Update sale (header, optionally replaces line items)
    public function update(UpdateSaleRequest $request, Sale $sale)
    {
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

            return response()->json([
                'success' => true,
                'message' => 'Sale updated successfully.',
                'data' => $sale->load('details.product', 'user')
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
}
