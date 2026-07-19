<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'total_products'   => $this->safe(fn() => $this->totalProducts(), 0),
            'total_suppliers'  => $this->safe(fn() => $this->totalSuppliers(), 0),
            'total_purchases'  => $this->safe(fn() => $this->totalPurchases(), 0),
            'total_sales'      => $this->safe(fn() => $this->totalSales(), 0),
            'low_stock'        => $this->safe(fn() => $this->lowStockCount(), 0),
            'inventory_value'  => $this->safe(fn() => $this->inventoryValue(), 0),

            'sales_trend'         => $this->safe(fn() => $this->salesTrend(), []),
            'category_breakdown'  => $this->safe(fn() => $this->categoryBreakdown(), []),
            'low_stock_items'     => $this->safe(fn() => $this->lowStockItems(), []),
            'recent_activity'     => $this->safe(fn() => $this->recentActivity(), []),
        ]);
    }

    /**
     * Run a metric query and fall back to a default instead of taking
     * down the whole dashboard if one view/column name is wrong. Logs
     * the real error so it's still visible in storage/logs/laravel.log.
     */
    private function safe(\Closure $fn, mixed $default): mixed
    {
        try {
            return $fn();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Dashboard metric failed: ' . $e->getMessage());
            return $default;
        }
    }

    private function totalProducts(): int
    {
        return DB::table('products')->count();
    }

    private function totalSuppliers(): int
    {
        return DB::table('suppliers')->count();
    }

    private function totalPurchases(): int
    {
        return DB::table('vw_purchase_summary')->count();
    }

    private function totalSales(): int
    {
        return DB::table('vw_sales_summary')->count();
    }

    private function lowStockCount(): int
    {
        return DB::table('vw_product_inventory')
            ->whereColumn('quantity_in_stock', '<=', 'reorder_level')
            ->count();
    }

    private function inventoryValue(): float
    {
        // Valued at cost price (quantity_in_stock * cost_price) —
        // switch to unit_price if you want it valued at sale price instead.
        $result = DB::table('vw_product_inventory')
            ->selectRaw('SUM(quantity_in_stock * cost_price) as total')
            ->first();

        return (float) ($result->total ?? 0);
    }

    /**
     * Daily sales vs purchases for the last 30 days.
     * Shape: [{ date: "Jul 01", sales: 4200, purchases: 2800 }, ...]
     */
    private function salesTrend(): array
    {
        $sales = DB::table('vw_sales_summary')
            ->select(
                DB::raw("TRUNC(sale_date) as day_key"),
                DB::raw("TO_CHAR(sale_date, 'Mon DD') as day_label"),
                DB::raw('SUM(total_amount) as amount')
            )
            ->where('sale_date', '>=', now()->subDays(30))
            ->groupBy(DB::raw('TRUNC(sale_date)'), DB::raw("TO_CHAR(sale_date, 'Mon DD')"))
            ->get()
            ->keyBy(fn($row) => \Carbon\Carbon::parse($row->day_key)->toDateString());

        $purchases = DB::table('vw_purchase_summary')
            ->select(
                DB::raw("TRUNC(purchase_date) as day_key"),
                DB::raw("TO_CHAR(purchase_date, 'Mon DD') as day_label"),
                DB::raw('SUM(total_amount) as amount')
            )
            ->where('purchase_date', '>=', now()->subDays(30))
            ->groupBy(DB::raw('TRUNC(purchase_date)'), DB::raw("TO_CHAR(purchase_date, 'Mon DD')"))
            ->get()
            ->keyBy(fn($row) => \Carbon\Carbon::parse($row->day_key)->toDateString());

        // Merge all date keys (Y-m-d) and sort chronologically
        $allDateKeys = $sales->keys()
            ->merge($purchases->keys())
            ->unique()
            ->sort() // sorts ISO date strings correctly, ascending
            ->values();

        return $allDateKeys->map(function ($dateKey) use ($sales, $purchases) {
            $saleRow = $sales[$dateKey] ?? null;
            $purchaseRow = $purchases[$dateKey] ?? null;

            $label = $saleRow->day_label ?? $purchaseRow->day_label
                ?? \Carbon\Carbon::parse($dateKey)->format('M d');

            return [
                'date'      => $label,
                'sales'     => (float) ($saleRow->amount ?? 0),
                'purchases' => (float) ($purchaseRow->amount ?? 0),
            ];
        })->values()->all();
    }

    /**
     * Shape: [{ name: "Electronics", value: 320 }, ...]
     */
    private function categoryBreakdown(): array
    {
        return DB::table('vw_product_inventory')
            ->select('category_name as name', DB::raw('SUM(quantity_in_stock) as value'))
            ->groupBy('category_name')
            ->orderByDesc(DB::raw('SUM(quantity_in_stock)'))
            ->get()
            ->map(fn($row) => ['name' => $row->name, 'value' => (int) $row->value])
            ->all();
    }

    /**
     * Shape: [{ name, sku, quantity_in_stock, reorder_level }, ...]
     */
    private function lowStockItems(): array
    {
        return DB::table('vw_product_inventory')
            ->select(
                'product_name as name',
                'product_code as sku',
                'quantity_in_stock',
                'reorder_level'
            )
            ->whereColumn('quantity_in_stock', '<=', 'reorder_level')
            ->orderBy('quantity_in_stock')
            ->limit(10)
            ->get()
            ->toArray();
    }

    /**
     * Shape: [{ message, time }, ...]
     * Reads from stock_history (populated by trg_stock_history on products.quantity_in_stock updates).
     */
    private function recentActivity(): array
    {
        return DB::table('stock_history as sh')
            ->join('products as p', 'p.product_id', '=', 'sh.product_id')
            ->select(
                'p.product_name',
                'sh.transaction_type',
                'sh.quantity',
                'sh.old_quantity',
                'sh.new_quantity',
                'sh.created_at'
            )
            ->orderByDesc('sh.created_at')
            ->limit(8)
            ->get()
            ->map(function ($row) {
                $delta = (int) $row->quantity;
                $direction = $delta >= 0 ? 'increased' : 'decreased';

                $message = sprintf(
                    '%s stock %s by %d (%d → %d)',
                    $row->product_name,
                    $direction,
                    abs($delta),
                    $row->old_quantity,
                    $row->new_quantity
                );

                return [
                    'message' => $message,
                    'time'    => \Carbon\Carbon::parse($row->created_at)->diffForHumans(),
                ];
            })
            ->all();
    }
}
