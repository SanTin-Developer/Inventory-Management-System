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
        return DB::table('purchases')->count();
    }

    private function totalSales(): int
    {
        return DB::table('sales')->count();
    }

    private function lowStockCount(): int
    {
        // TODO: confirm the actual column names on vw_product_inventory —
        // assumed quantity / reorder_level below.
        return DB::table('vw_product_inventory')
            ->whereColumn('quantity', '<=', 'reorder_level')
            ->count();
    }

    private function inventoryValue(): float
    {
        // TODO: confirm vw_inventory_value's column name for the total —
        // assumed total_value below.
        return (float) DB::table('vw_inventory_value')->sum('total_value');
    }

    /**
     * Daily sales vs purchases for the last 30 days.
     * Shape: [{ date: "Jul 01", sales: 4200, purchases: 2800 }, ...]
     */
    private function salesTrend(): array
    {
        // TODO: adjust table/column names — assumes a `sales` table with
        // sale_date + total, and a `purchases` table with purchase_date + total.
        $sales = DB::table('sales')
            ->select(DB::raw("TO_CHAR(sale_date, 'Mon DD') as day"), DB::raw('SUM(total) as amount'))
            ->where('sale_date', '>=', now()->subDays(30))
            ->groupBy(DB::raw("TO_CHAR(sale_date, 'Mon DD')"), DB::raw('TRUNC(sale_date)'))
            ->orderBy(DB::raw('TRUNC(sale_date)'))
            ->get()
            ->keyBy('day');

        $purchases = DB::table('purchases')
            ->select(DB::raw("TO_CHAR(purchase_date, 'Mon DD') as day"), DB::raw('SUM(total) as amount'))
            ->where('purchase_date', '>=', now()->subDays(30))
            ->groupBy(DB::raw("TO_CHAR(purchase_date, 'Mon DD')"), DB::raw('TRUNC(purchase_date)'))
            ->orderBy(DB::raw('TRUNC(purchase_date)'))
            ->get()
            ->keyBy('day');

        $days = $sales->keys()->merge($purchases->keys())->unique();

        return $days->map(fn($day) => [
            'date'      => $day,
            'sales'     => (float) ($sales[$day]->amount ?? 0),
            'purchases' => (float) ($purchases[$day]->amount ?? 0),
        ])->values()->all();
    }

    /**
     * Shape: [{ name: "Electronics", value: 320 }, ...]
     */
    private function categoryBreakdown(): array
    {
        // TODO: confirm vw_product_inventory has a category_name + quantity
        // column, or join against `categories` if it only has category_id.
        return DB::table('vw_product_inventory')
            ->select('category_name as name', DB::raw('SUM(quantity) as value'))
            ->groupBy('category_name')
            ->orderByDesc(DB::raw('SUM(quantity)'))
            ->get()
            ->map(fn($row) => ['name' => $row->name, 'value' => (int) $row->value])
            ->all();
    }

    /**
     * Shape: [{ name, sku, quantity, reorder_level }, ...]
     */
    private function lowStockItems(): array
    {
        return DB::table('vw_product_inventory')
            ->select('product_name as name', 'sku', 'quantity', 'reorder_level')
            ->whereColumn('quantity', '<=', 'reorder_level')
            ->orderBy('quantity')
            ->limit(10)
            ->get()
            ->toArray();
    }

    /**
     * Shape: [{ message, time }, ...]
     * TODO: point this at your stock-history / audit log table once it's
     * populated — table name assumed as `stock_history` below.
     */
    private function recentActivity(): array
    {
        return DB::table('stock_history')
            ->select('description as message', 'created_at')
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(fn($row) => [
                'message' => $row->message,
                'time'    => \Carbon\Carbon::parse($row->created_at)->diffForHumans(),
            ])
            ->all();
    }
}
