<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Global search across the system.
 *
 * ASSUMPTIONS — adjust these to match your actual schema if they're off:
 *   - products, categories, suppliers, customers follow the same naming
 *     convention as the existing views: product_name, category_name,
 *     supplier_name, customer_name, with product_id/category_id/
 *     supplier_id/customer_id primary keys.
 *   - SALES confirmed via DESCRIBE SALES: sale_id, user_id, customer_name,
 *     sale_date, total_amount, payment_method, status, created_at,
 *     updated_at, discount_amount — customer_name is a direct column,
 *     no customers FK to join.
 *   - PURCHASES is assumed to mirror that pattern (supplier_name stored
 *     directly), since its columns line up with vw_purchase_summary the
 *     same way SALES lines up with vw_sales_summary. Not yet confirmed —
 *     run DESCRIBE PURCHASES if this section 500s.
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

        // SALES stores customer_name directly (confirmed via DESCRIBE SALES —
        // no customer_id FK), matching vw_sales_summary. No join needed.
        $salesQuery = DB::table('sales')
            ->select('sale_id', 'customer_name', 'sale_date', 'total_amount', 'status')
            ->whereRaw('UPPER(customer_name) LIKE ?', [$needle]);
        if (is_numeric($term)) {
            $salesQuery->orWhere('sale_id', (int) $term);
        }
        $sales = $salesQuery->limit($limit)->get();

        // Assuming PURCHASES mirrors SALES's pattern (supplier_name stored
        // directly, matching vw_purchase_summary). If this 500s with an
        // "invalid identifier" error, run DESCRIBE PURCHASES and send me
        // the real column list — same fix as we just did for SALES.
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
