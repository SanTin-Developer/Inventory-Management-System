<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $categoryId = $this->route('category')
            ->category_id;

        return [
            'category_name' => [
                'required',
                'string',
                'max:100',

                Rule::unique('categories', 'category_name')
                    ->ignore($categoryId, 'category_id')
            ],

            'description' => [

                'nullable',

                'string',

                'max:255'

            ]
        ];
    }

    public function messages():array
    {
        return [
            'category_name.required'
                => 'Category name is required'
        ]
    }
}
