<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $product = $this->route('product');

        $productId = $product instanceof Product
            ? $product->product_id
            : $product;

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

            'product_code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('products', 'product_code')
                    ->ignore($productId, 'product_id')
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
