<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Global search across the system.
 *
 * ASSUMPTIONS — adjust these to match your actual schema if they're off:
 *   - Table/column names below follow the same convention as your existing
 *     views (vw_product_inventory, vw_sales_summary, vw_purchase_summary),
 *     i.e. products.product_name, categories.category_name,
 *     suppliers.supplier_name, customers.customer_name.
 *   - Primary keys are product_id, category_id, supplier_id, customer_id,
 *     sale_id, purchase_id.
 *   - Oracle string comparison is case-sensitive by default, so this uses
 *     UPPER() on both sides rather than relying on LIKE alone.
 *   - Each section is capped at $limit (default 5) so the dropdown stays
 *     short; the frontend can add a "view all results" link per section
 *     if you want a dedicated full search-results page later.
 *
 * If any table/column name doesn't match your real schema, this will throw
 * an Oracle "invalid identifier" error — that's the signal to fix the name,
 * not a bug in the query logic.
 */
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
