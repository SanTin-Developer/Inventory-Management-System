<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Purchase;
use App\Models\Sale;

class DashboardController extends Controller
{
    public function index()
    {
        $totalProducts = Product::count();
        $totalSuppliers = Supplier::count();
        $totalPurchases = Purchase::sum('total_amount');
        $totalSales = Sale::sum('total_amount');

        $lowStock = Product::whereColumn(
            'quantity_in_stock',
            '<=',
            'reorder_level'
        )->count();

        $inventoryValue = Product::selectRaw(
            'SUM(quantity_in_stock * cost_price) as total'
        )->first();

        return response()->json([
            'total_products'   => $totalProducts,
            'total_suppliers'  => $totalSuppliers,
            'total_purchases'  => $totalPurchases,
            'total_sales'      => $totalSales,
            'low_stock'        => $lowStock,
            'inventory_value'  => $inventoryValue->total ?? 0,
        ]);
    }
}
