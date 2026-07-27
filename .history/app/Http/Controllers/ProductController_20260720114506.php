<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use Exception;

class ProductController extends Controller
{
    // Get all products
    public function index(Request $request)
    {
        $keyword = $request->search;
        $categoryId = $request->category;

        $products = Product::query()
            ->with('category')
            ->when($keyword, function ($query) use ($keyword) {
                $query->where(function ($q) use ($keyword) {
                    $q->where('product_name', 'like', "%{$keyword}%")
                        ->orWhere('product_code', 'like', "%{$keyword}%");
                });
            })
            ->when($categoryId, function ($query) use ($categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->orderBy('product_id', 'desc')
            ->paginate($request->input('per_page', 10)); // <-- ផ្លាស់ប្តូរត្រង់នេះ

        return response()->json($products);
    }

    // Create product
    public function store(StoreProductRequest $request)
    {
        DB::beginTransaction();

        try {

            $product = Product::create($request->validated());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Product created successfully.',
                'data' => $product
            ], 201);
        } catch (Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // API EndPoint for Stats
    // In your ProductController (or a new Api\ProductStatsController)
    public function stats()
    {
        $counts = DB::table('vw_product_inventory')
            ->selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN quantity_in_stock <= 0 THEN 1 ELSE 0 END) as out_of_stock,
            SUM(CASE WHEN quantity_in_stock > 0 AND quantity_in_stock <= reorder_level THEN 1 ELSE 0 END) as low_stock,
            SUM(CASE WHEN quantity_in_stock > reorder_level THEN 1 ELSE 0 END) as in_stock,
            SUM(quantity_in_stock * cost_price) as inventory_value
        ")
            ->first();

        $byCategory = DB::table('vw_product_inventory')
            ->select('category_name as name', DB::raw('COUNT(*) as value'))
            ->groupBy('category_name')
            ->orderByDesc(DB::raw('COUNT(*)'))
            ->get();

        return response()->json([
            'total'            => (int) $counts->total,
            'in_stock'         => (int) $counts->in_stock,
            'low_stock'        => (int) $counts->low_stock,
            'out_of_stock'     => (int) $counts->out_of_stock,
            'inventory_value'  => (float) $counts->inventory_value,
            'by_category'      => $byCategory,
        ]);
    }

    // Show product
    public function show(Product $product)
    {
        return response()->json($product->load('category'));
    }

    // Update product
    public function update(UpdateProductRequest $request, Product $product)
    {
        DB::beginTransaction();

        try {

            $product->update($request->validated());

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Product updated successfully.',
                'data' => $product
            ]);
        } catch (Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // Delete product
    public function destroy(Product $product)
    {
        try {

            $product->delete();

            return response()->json([
                'success' => true,
                'message' => 'Product deleted successfully.'
            ]);
        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Product cannot be deleted because it is referenced in purchases, sales, or stock history.'
            ], 500);
        }
    }
}
