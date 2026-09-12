<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCategoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'category_name' => [
                'required',
                'string',
                'max:100',
                'unique:categories,category_name',
            ],

            // Optional on create — if omitted, CategoryController@store
            // auto-generates it from the new category's ID (e.g. "C-1042").
            'category_code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('categories', 'category_code'),
            ],

            'description' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }

    public function messages(): array
    {
        return [

            'category_name.required' => 'Category name is required.',

            'category_name.unique' => 'This category already exists.',

            'category_name.max' => 'Category name cannot exceed 100 characters.',

            'category_code.unique' => 'This category code is already in use.',
        ];
    }
}
