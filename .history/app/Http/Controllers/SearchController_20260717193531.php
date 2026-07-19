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

        // Sales/purchases don't have a natural "name" field, so match by
        // the related customer/supplier name or by the record's own id
        // if the term looks numeric.
        $salesQuery = DB::table('sales')
            ->join('customers', 'customers.customer_id', '=', 'sales.customer_id')
            ->select('sales.sale_id', 'customers.customer_name', 'sales.sale_date', 'sales.total_amount', 'sales.status')
            ->whereRaw('UPPER(customers.customer_name) LIKE ?', [$needle]);
        if (is_numeric($term)) {
            $salesQuery->orWhere('sales.sale_id', (int) $term);
        }
        $sales = $salesQuery->limit($limit)->get();

        $purchasesQuery = DB::table('purchases')
            ->join('suppliers', 'suppliers.supplier_id', '=', 'purchases.supplier_id')
            ->select('purchases.purchase_id', 'suppliers.supplier_name', 'purchases.purchase_date', 'purchases.total_amount', 'purchases.status')
            ->whereRaw('UPPER(suppliers.supplier_name) LIKE ?', [$needle]);
        if (is_numeric($term)) {
            $purchasesQuery->orWhere('purchases.purchase_id', (int) $term);
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
