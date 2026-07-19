<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\Sale;
use App\Models\SaleDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * GET /api/reports/sales-summary?from=&to=&group_by=day|month
     *
     * Revenue totals over a date range, optionally bucketed by day or month.
     */
    public function salesSummary(Request $request)
    {
        $validated = $request->validate([
            'from'     => 'nullable|date',
            'to'       => 'nullable|date',
            'group_by' => 'nullable|in:day,month',
        ]);

        $from    = $validated['from'] ?? now()->subDays(30)->toDateString();
        $to      = $validated['to'] ?? now()->toDateString();
        $groupBy = $validated['group_by'] ?? 'day';

        // Oracle date-format model (TO_CHAR), not MySQL's DATE_FORMAT
        $dateFormat = $groupBy === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
        $periodExpr = "TO_CHAR(sale_date, '{$dateFormat}')";

        $query = Sale::whereBetween('sale_date', [$from, $to]);

        $totals = (clone $query)
            ->selectRaw('COUNT(*) as total_sales, COALESCE(SUM(total_amount), 0) as total_revenue')
            ->first();

        // Oracle doesn't allow GROUP BY / ORDER BY on a SELECT alias,
        // so the raw expression is repeated rather than referencing "period".
        $breakdown = (clone $query)
            ->selectRaw("{$periodExpr} as period, COUNT(*) as total_sales, COALESCE(SUM(total_amount), 0) as total_revenue")
            ->groupByRaw($periodExpr)
            ->orderByRaw($periodExpr)
            ->get();

        $byPaymentMethod = (clone $query)
            ->selectRaw('payment_method, COUNT(*) as total_sales, COALESCE(SUM(total_amount), 0) as total_revenue')
            ->groupBy('payment_method')
            ->get();

        return response()->json([
            'from'              => $from,
            'to'                => $to,
            'group_by'          => $groupBy,
            'total_sales'       => (int) $totals->total_sales,
            'total_revenue'     => (float) $totals->total_revenue,
            'breakdown'         => $breakdown,
            'by_payment_method' => $byPaymentMethod,
        ]);
    }

    /**
     * GET /api/reports/purchase-summary?from=&to=
     *
     * Spend totals over a date range, grouped by supplier.
     */
    public function purchaseSummary(Request $request)
    {
        $validated = $request->validate([
            'from' => 'nullable|date',
            'to'   => 'nullable|date',
        ]);

        $from = $validated['from'] ?? now()->subDays(30)->toDateString();
        $to   = $validated['to'] ?? now()->toDateString();

        $query = Purchase::whereBetween('purchase_date', [$from, $to]);

        $totals = (clone $query)
            ->selectRaw('COUNT(*) as total_purchases, COALESCE(SUM(total_amount), 0) as total_spend')
            ->first();

        $bySupplier = (clone $query)
            ->join('suppliers', 'suppliers.supplier_id', '=', 'purchases.supplier_id')
            ->selectRaw('suppliers.supplier_id, suppliers.supplier_name, COUNT(purchases.purchase_id) as total_purchases, COALESCE(SUM(purchases.total_amount), 0) as total_spend')
            ->groupBy('suppliers.supplier_id', 'suppliers.supplier_name')
            ->orderByDesc('total_spend')
            ->get();

        $byStatus = (clone $query)
            ->selectRaw('status, COUNT(*) as total_purchases, COALESCE(SUM(total_amount), 0) as total_spend')
            ->groupBy('status')
            ->get();

        return response()->json([
            'from'             => $from,
            'to'               => $to,
            'total_purchases'  => (int) $totals->total_purchases,
            'total_spend'      => (float) $totals->total_spend,
            'by_supplier'      => $bySupplier,
            'by_status'        => $byStatus,
        ]);
    }

    /**
     * GET /api/reports/inventory?low_stock_only=true
     *
     * Current stock levels, low-stock alerts, and inventory valuation.
     */
    public function inventory(Request $request)
    {
        $validated = $request->validate([
            'low_stock_only' => 'nullable|boolean',
        ]);

        $lowStockOnly = filter_var($validated['low_stock_only'] ?? false, FILTER_VALIDATE_BOOLEAN);

        // Oracle (unlike MySQL) doesn't allow SELECT *, expr — an explicit
        // column list is required when mixing table columns with a computed one.
        $query = Product::with('category')
            ->selectRaw(
                'product_id, category_id, product_name, product_code, unit_price, '
                    . 'cost_price, quantiry_in_stock, reorder_level, unit, '
                    . '(quantiry_in_stock * cost_price) as stock_value'
            );

        if ($lowStockOnly) {
            $query->whereColumn('quantiry_in_stock', '<=', 'reorder_level');
        }

        $products = $query->orderBy('quantiry_in_stock')->get();

        $valuation = Product::selectRaw('COALESCE(SUM(quantiry_in_stock * cost_price), 0) as total_cost_value, COALESCE(SUM(quantiry_in_stock * unit_price), 0) as total_retail_value')
            ->first();

        $lowStockCount = Product::whereColumn('quantiry_in_stock', '<=', 'reorder_level')->count();

        return response()->json([
            'total_products'        => Product::count(),
            'low_stock_count'       => $lowStockCount,
            'total_cost_value'      => (float) $valuation->total_cost_value,
            'total_retail_value'    => (float) $valuation->total_retail_value,
            'products'              => $products,
        ]);
    }

    /**
     * GET /api/reports/top-products?from=&to=&limit=&order_by=quantity|revenue
     *
     * Best-selling products ranked by units sold or revenue generated.
     */
    public function topProducts(Request $request)
    {
        $validated = $request->validate([
            'from'     => 'nullable|date',
            'to'       => 'nullable|date',
            'limit'    => 'nullable|integer|min:1|max:100',
            'order_by' => 'nullable|in:quantity,revenue',
        ]);

        $from    = $validated['from'] ?? now()->subDays(30)->toDateString();
        $to      = $validated['to'] ?? now()->toDateString();
        $limit   = $validated['limit'] ?? 10;
        $orderBy = $validated['order_by'] ?? 'quantity';

        $orderColumn = $orderBy === 'revenue' ? 'total_revenue' : 'total_quantity_sold';

        $products = SaleDetail::join('sales', 'sales.sale_id', '=', 'sale_details.sale_id')
            ->join('products', 'products.product_id', '=', 'sale_details.product_id')
            ->whereBetween('sales.sale_date', [$from, $to])
            ->selectRaw('products.product_id, products.product_name, products.product_code, SUM(sale_details.quantity) as total_quantity_sold, COALESCE(SUM(sale_details.quantity * sale_details.unit_price), 0) as total_revenue')
            ->groupBy('products.product_id', 'products.product_name', 'products.product_code')
            ->orderByDesc($orderColumn)
            ->limit($limit)
            ->get();

        return response()->json([
            'from'     => $from,
            'to'       => $to,
            'order_by' => $orderBy,
            'products' => $products,
        ]);
    }

    /**
     * GET /api/reports/slow-moving?from=&to=&limit=
     *
     * Products with the least (or zero) sales activity in the given period.
     * Uses a left join so products with no sales at all are still included.
     */
    public function slowMovingProducts(Request $request)
    {
        $validated = $request->validate([
            'from'  => 'nullable|date',
            'to'    => 'nullable|date',
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        $from  = $validated['from'] ?? now()->subDays(30)->toDateString();
        $to    = $validated['to'] ?? now()->toDateString();
        $limit = $validated['limit'] ?? 10;

        $products = Product::leftJoin('sale_details', 'sale_details.product_id', '=', 'products.product_id')
            ->leftJoin('sales', function ($join) use ($from, $to) {
                $join->on('sales.sale_id', '=', 'sale_details.sale_id')
                    ->whereBetween('sales.sale_date', [$from, $to]);
            })
            ->selectRaw('products.product_id, products.product_name, products.product_code, products.quantiry_in_stock, COALESCE(SUM(sale_details.quantity), 0) as total_quantity_sold')
            ->groupBy('products.product_id', 'products.product_name', 'products.product_code', 'products.quantiry_in_stock')
            ->orderBy('total_quantity_sold')
            ->limit($limit)
            ->get();

        return response()->json([
            'from'     => $from,
            'to'       => $to,
            'products' => $products,
        ]);
    }
}
