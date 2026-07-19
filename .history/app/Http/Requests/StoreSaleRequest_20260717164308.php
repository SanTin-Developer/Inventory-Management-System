<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSaleRequest extends FormRequest
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
                'nullable',
                'string',
                Rule::in(['Completed', 'Refunded', 'Cancelled'])
            ],

            'details' => [
                'required',
                'array',
                'min:1'
            ],

            'details.*.product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'product_id')
            ],

            'details.*.quantity' => [
                'required',
                'integer',
                'min:1'
            ],

            'details.*.unit_price' => [
                'required',
                'numeric',
                'min:0'
            ],
        ];
    }
}
