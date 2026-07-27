<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => [
                'required',
                'integer',
                Rule::exists('categories', 'category_id')
            ],

            'product_name' => [
                'required',
                'string',
                'max:150'
            ],

            // Optional on create — if omitted, ProductController@store
            // auto-generates it from the new product's ID (e.g. "P-1132").
            // Still validated/unique if the caller does supply one manually.
                'product_code' => [
                    'nullable',
                    'string',
                    'max:50',
                    Rule::unique('products', 'product_code')
                ],

            'unit_price' => [
                'required',
                'numeric',
                'min:0',
                'max:99999999.99'
            ],

            'cost_price' => [
                'required',
                'numeric',
                'min:0',
                'max:99999999.99'
            ],

            'quantity_in_stock' => [
                'nullable',
                'integer',
                'min:0'
            ],

            'reorder_level' => [
                'nullable',
                'integer',
                'min:0'
            ],

            'unit' => [
                'nullable',
                'string',
                'max:20'
            ]
        ];
    }
}
