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
        DB::begin
    }

    // Update Category by Id
    public function edit(Category $category)
    {
        return view(
            'categories.edit',
            compact('category')
        );
    }
    public function update(Request $request, Category $category)
    {
        $category->update($request->all());

        return redirect()->route('categories.index');
    }

    // Delete category by Id
    public function destroy(Category $category)
    {
        $category->delete();

        return redirect()->route('categories.index');
    }
}
