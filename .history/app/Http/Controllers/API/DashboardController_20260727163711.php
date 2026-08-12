<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Cache the whole payload for 2 minutes. Dashboard numbers don't
        // need to be real-time-perfect, and this turns ~10 remote round
        // trips into ~1 for every user for 2 minutes at a time.
        $data = Cache::remember('dashboard.index', 120, function () {
            return [
                'counts'              => $this->safe(fn() => $this->coreCounts(), $this->emptyCounts()),
                'sales_trend'         => $this->safe(fn() => $this->salesTrend(), []),
                'category_breakdown'  => $this->safe(fn() => $this->categoryBreakdown(), []),
                'low_stock_items'     => $this->safe(fn() => $this->lowStockItems(), []),
                'recent_activity'     => $this->safe(fn() => $this->recentActivity(), []),
            ];
        });

        return response()->json([
            'total_products'   => $data['counts']['total_products'],
            'total_suppliers'  => $data['counts']['total_suppliers'],
            'total_purchases'  => $data['counts']['total_purchases'],
            'total_sales'      => $data['counts']['total_sales'],
            'low_stock'        => $data['counts']['low_stock'],
            'inventory_value'  => $data['counts']['inventory_value'],

            'sales_trend'         => $data['sales_trend'],
            'category_breakdown'  => $data['category_breakdown'],
            'low_stock_items'     => $data['low_stock_items'],
            'recent_activity'     => $data['recent_activity'],
        ]);
    }

    private function safe(\Closure $fn, mixed $default): mixed
    {
        try {
            return $fn();
        } catch (\Throwable $e) {
            Log::warning('Dashboard metric failed: ' . $e->getMessage());
            return $default;
        }
    }

    private function emptyCounts(): array
    {
        return [
            'total_products'  => 0,
            'total_suppliers' => 0,
            'total_purchases' => 0,
            'total_sales'     => 0,
            'low_stock'       => 0,
            'inventory_value' => 0,
        ];
    }

    /**
     * All the count/sum metrics in a single round trip using scalar
     * subqueries, instead of 6 separate DB::table()->count() calls.
     */
    private function coreCounts(): array
    {
        $row = DB::selectOne("
            SELECT
                (SELECT COUNT(*) FROM products)  AS total_products,
                (SELECT COUNT(*) FROM suppliers) AS total_suppliers,
                (SELECT COUNT(*) FROM vw_purchase_summary) AS total_purchases,
                (SELECT COUNT(*) FROM vw_sales_summary)    AS total_sales,
                (SELECT COUNT(*) FROM vw_product_inventory
                    WHERE quantity_in_stock <= reorder_level) AS low_stock,
                (SELECT COALESCE(SUM(quantity_in_stock * cost_price), 0)
                    FROM vw_product_inventory) AS inventory_value
        ");

        return [
            'total_products'  => (int) $row->total_products,
            'total_suppliers' => (int) $row->total_suppliers,
            'total_purchases' => (int) $row->total_purchases,
            'total_sales'     => (int) $row->total_sales,
            'low_stock'       => (int) $row->low_stock,
            'inventory_value' => (float) $row->inventory_value,
        ];
    }

    // API endpoint for alerting when a product is low on stock.
    // Kept separate from the cached index() payload since alerts
    // should reflect current state, not the 2-minute cache window.
    public function lowStockAlerts()
    {
        return response()->json([
            'low_stock'       => $this->safe(fn() => $this->lowStockCountFresh(), 0),
            'low_stock_items' => $this->safe(fn() => $this->lowStockItems(), []),
        ]);
    }

    private function lowStockCountFresh(): int
    {
        return DB::table('vw_product_inventory')
            ->whereColumn('quantity_in_stock', '<=', 'reorder_level')
            ->count();
    }

    /**
     * Daily sales vs purchases for the last 30 days.
     * Shape: [{ date: "Jul 01", sales: 4200, purchases: 2800 }, ...]
     *
     * Postgres has no TRUNC(date) — use DATE_TRUNC('day', column) instead,
     * and cast the result to ::date so it serializes as a plain date.
     */
    private function salesTrend(): array
    {
        $sales = DB::table('vw_sales_summary')
            ->select(
                DB::raw("DATE_TRUNC('day', sale_date)::date as day_key"),
                DB::raw("TO_CHAR(sale_date, 'Mon DD') as day_label"),
                DB::raw('SUM(total_amount) as amount')
            )
            ->where('sale_date', '>=', now()->subDays(30))
            ->groupBy(DB::raw("DATE_TRUNC('day', sale_date)"), DB::raw("TO_CHAR(sale_date, 'Mon DD')"))
            ->get()
            ->keyBy(fn($row) => \Carbon\Carbon::parse($row->day_key)->toDateString());

        $purchases = DB::table('vw_purchase_summary')
            ->select(
                DB::raw("DATE_TRUNC('day', purchase_date)::date as day_key"),
                DB::raw("TO_CHAR(purchase_date, 'Mon DD') as day_label"),
                DB::raw('SUM(total_amount) as amount')
            )
            ->where('purchase_date', '>=', now()->subDays(30))
            ->groupBy(DB::raw("DATE_TRUNC('day', purchase_date)"), DB::raw("TO_CHAR(purchase_date, 'Mon DD')"))
            ->get()
            ->keyBy(fn($row) => \Carbon\Carbon::parse($row->day_key)->toDateString());

        $allDateKeys = $sales->keys()
            ->merge($purchases->keys())
            ->unique()
            ->sort()
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
            ->map(fn($row) => [
                'name'              => $row->name,
                'sku'               => $row->sku,
                'quantity_in_stock' => (int) $row->quantity_in_stock,
                'reorder_level'     => (int) $row->reorder_level,
            ])
            ->all();
    }

    /**
     * Shape: [{ message, time }, ...]
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
