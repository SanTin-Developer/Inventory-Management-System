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
        $keyword = $request->search; // match the frontend's param name
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
            ->paginate(10);

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
