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
            -> when($search, function($query) use ($result){
                $query->where(
                    'category_name',
                    'LIKE',
                    '%{$result}%'
                );
            })->orderBy(
                'category_id',
                'DESC'
            )->paginate
    }

    // Create new category
    public function create()
    {
        return view('categories.create');
    }
    public function store(Request $request)
    {
        Category::create([
            'category_name' => $request->category_name,
            'description' => $request->description
        ]);

        return redirect()->route('categories.index');
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
