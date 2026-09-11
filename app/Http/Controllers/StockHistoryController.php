<?php

namespace App\Http\Controllers;

use App\Models\StockHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockHistoryController extends Controller
{
    // Get all stock history entries
    public function index(Request $request)
    {
        $productId = $request->product_id;
        $type = $request->transaction_type;

        $history = StockHistory::query()
            ->with('product')
            ->when($productId, function ($query) use ($productId) {
                $query->where('product_id', $productId);
            })
            ->when($type, function ($query) use ($type) {
                $query->where('transaction_type', $type);
            })
            ->orderBy('history_id', 'desc')
            ->paginate(10);

        return response()->json($history);
    }

    // Show single stock history entry
    public function show(StockHistory $stockHistory)
    {
        return response()->json($stockHistory->load('product'));
    }

    public function stats(Request $request)
    {
        $productId = $request->product_id;

        $counts = DB::table('stock_history')
            ->when($productId, fn ($q) => $q->where('product_id', $productId))
            ->selectRaw('
            COUNT(*) as total,
            SUM(CASE WHEN quantity >= 0 THEN 1 ELSE 0 END) as increases,
            SUM(CASE WHEN quantity < 0 THEN 1 ELSE 0 END) as decreases
        ')
            ->first();

        return response()->json([
            'total' => (int) $counts->total,
            'increases' => (int) $counts->increases,
            'decreases' => (int) $counts->decreases,
        ]);
    }
}
