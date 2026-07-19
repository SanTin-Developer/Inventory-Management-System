<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => [
                'required',
                'integer',
                Rule::exists('users', 'user_id')
            ],

            'customer_name' => [
                'nullable',
                'string',
                'max:100'
            ],

            'sale_date' => [
                'nullable',
                'date'
            ],

            'payment_method' => [
                'nullable',
                'string',
                Rule::in(['Cash', 'Card', 'Bank Transfer', 'Mobile Payment'])
            ],

            'status' => [
                'required',
                'string',
                Rule::in(['Completed', 'Refunded', 'Cancelled'])
            ],

            'discount_amount' => 'nullable|numeric|min:0',

            'details' => [
                'sometimes',
                'array',
                'min:1'
            ],

            'total_amount' => [
                'nullable',
                'numeric',
                'min:0'
            ],

            'details.*.product_id' => [
                'required_with:details',
                'integer',
                Rule::exists('products', 'product_id')
            ],

            'details.*.quantity' => [
                'required_with:details',
                'integer',
                'min:1'
            ],

            'details.*.unit_price' => [
                'required_with:details',
                'numeric',
                'min:0'
            ],
        ];
    }
}
