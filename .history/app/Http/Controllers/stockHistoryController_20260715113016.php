<?php

namespace App\Http\Controllers;

use App\Models\StockHistory;
use Illuminate\Http\Request;

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
}
