<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;

class CategoryController extends Controller
{
    // GET /api/categories
    public function index(Request $request)
    {
        $search = $request->search;

        $categories = Category::query()
            ->when($search, function ($query) use ($search) {
                $query->where('category_name', 'LIKE', "%{$search}%");
            })
            ->orderBy('category_id', 'DESC')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Categories retrieved successfully.',
            'data' => $categories
        ], 200);
    }

    // GET /api/categories/{id}
    public function show($id)
    {
        $category = Category::find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $category
        ], 200);
    }

    // POST /api/categories
    public function store(StoreCategoryRequest $request)
    {
        DB::beginTransaction();

        try {

            $validated = $request->validated();
            $needsGeneratedCode = empty($validated['category_code']);

            // category_code is NOT NULL, so we can't insert blank and fill
            // it in afterward — the insert would fail first. Use a
            // short-lived unique placeholder to satisfy the constraint,
            // then immediately overwrite it with "C-{category_id}" once
            // we know the new ID.
            if ($needsGeneratedCode) {
                $validated['category_code'] = 'TMP-' . uniqid();
            }   

            $category = Category::create($validated);

            if ($needsGeneratedCode) {
                $category->category_code = 'C-' . $category->category_id;
                $category->save();
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Category created successfully.',
                'data' => $category
            ], 201);
        } catch (Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    private function generateUniqueProductCode(): string
    {
        do {
            $code = 'P-' . random_int(10000, 99999);
        } while (Category::where('product_code', $code)->exists());

        return $code;
    }

    // PUT /api/categories/{id}
    public function update(UpdateCategoryRequest $request, Category $category)
    {
        DB::beginTransaction();
        try {
            $category->update($request->validated());
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Category updated successfully.',
                'data' => $category,
            ], 200);
        } catch (Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
    // DELETE /api/categories/{id}
    public function destroy($id)
    {
        try {

            $category = Category::find($id);

            if (!$category) {
                return response()->json([
                    'success' => false,
                    'message' => 'Category not found.'
                ], 404);
            }

            $category->delete();

            return response()->json([
                'success' => true,
                'message' => 'Category deleted successfully.'
            ], 200);
        } catch (Exception $e) {

            return response()->json([
                'success' => false,
                'message' => 'Cannot delete category. It may have related products.'
            ], 500);
        }
    }
}
