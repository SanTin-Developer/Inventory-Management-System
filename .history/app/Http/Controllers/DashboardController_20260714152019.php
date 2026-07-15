<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Purchase;
use App\Models\Sale;

class DashboardController extends Controller
{
    //
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

        $inventoryValue = Product::sle
    }
}
