<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Category;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use Illuminate\Support\Facades\DB;
use Exception;

class CategoryController extends Controller
{
    // Get all categories
    public function index(Request $request)
    {
        $result = $request->results;

        $categories = Category::query()
            ->when($result, function ($query) use ($result) {
                $query->where(
                    'category_name',
                    'LIKE',
                    '%{$result}%'
                );
            })->orderBy(
                'category_id',
                'DESC'
            )->paginate(10);

        return view(
            'categories.index',
            compact('categories')
        );
    }

    // Show create page
    public function create()
    {
        return view('categories.create');
    }

    // Store category
    public function store(StoreCategoryRequest $request)
    {
        DB::beginTransaction();

        try {
            Category::create(
                $request->validated()
            );

            DB::commit();

            return redirect()->route('categories.index')
                ->with(
                    'success',
                    'Category created successfully.'
                );
        } catch (Exception $e) {
            DB::rollBack();

            return back()->with(
                'error',
                $e->getMessage()
            );
        }
    }

    // Show Category detail
    public function show(Category $category)
    {
        return view(
            'categories.show',
            compact('category')
        );
    }

    // Edit Category by Id
    public function edit(Category $category)
    {
        return view(
            'categories.edit',
            compact('category')
        );
    }

    // Update Category
    public function update(UpdateCategoryRequest $request, Category $category)
    {
        DB::beginTransaction();

        try{
            $category->update(
                
            )
        }
    }

    // Delete category by Id
    public function destroy(Category $category)
    {
        $category->delete();

        return redirect()->route('categories.index');
    }
}
