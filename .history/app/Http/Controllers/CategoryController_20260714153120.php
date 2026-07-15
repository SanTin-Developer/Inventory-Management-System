<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Category;

class CategoryController extends Controller
{
    // Get all categories
    public function index()
    {
        $categories = Category::all();

        return view(
            'categories.index',
            compact('categories')
        );
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
    public function update(Category $category)
    {
        return view(
            
        )
    }
}
