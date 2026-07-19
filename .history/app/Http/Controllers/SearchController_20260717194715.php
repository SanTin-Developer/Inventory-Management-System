<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2|max:100',
        ]);

        $term = trim($request->query('q'));
        $limit = (int) $request->query('limit', 5);
        $needle = '%' . strtoupper($term) . '%';

        $products = DB::table('products')
            ->select('product_id', 'product_name', 'product_code', 'quantity_in_stock', 'reorder_level')
            ->whereRaw('UPPER(product_name) LIKE ?', [$needle])
            ->orWhereRaw('UPPER(product_code) LIKE ?', [$needle])
            ->limit($limit)
            ->get();

        $categories = DB::table('categories')
            ->select('category_id', 'category_name')
            ->whereRaw('UPPER(category_name) LIKE ?', [$needle])
            ->limit($limit)
            ->get();

        $suppliers = DB::table('suppliers')
            ->select('supplier_id', 'supplier_name')
            ->whereRaw('UPPER(supplier_name) LIKE ?', [$needle])
            ->limit($limit)
            ->get();

        $customers = DB::table('customers')
            ->select('customer_id', 'customer_name')
            ->whereRaw('UPPER(customer_name) LIKE ?', [$needle])
            ->limit($limit)
            ->get();


        $salesQuery = DB::table('sales')
            ->select('sale_id', 'customer_name', 'sale_date', 'total_amount', 'status')
            ->whereRaw('UPPER(customer_name) LIKE ?', [$needle]);
        if (is_numeric($term)) {
            $salesQuery->orWhere('sale_id', (int) $term);
        }
        $sales = $salesQuery->limit($limit)->get();

        $purchasesQuery = DB::table('purchases')
            ->select('purchase_id', 'supplier_name', 'purchase_date', 'total_amount', 'status')
            ->whereRaw('UPPER(supplier_name) LIKE ?', [$needle]);
        if (is_numeric($term)) {
            $purchasesQuery->orWhere('purchase_id', (int) $term);
        }
        $purchases = $purchasesQuery->limit($limit)->get();

        return response()->json([
            'query' => $term,
            'products' => $products,
            'categories' => $categories,
            'suppliers' => $suppliers,
            'customers' => $customers,
            'sales' => $sales,
            'purchases' => $purchases,
            'total' => $products->count() + $categories->count() + $suppliers->count()
                + $customers->count() + $sales->count() + $purchases->count(),
        ]);
    }
}
