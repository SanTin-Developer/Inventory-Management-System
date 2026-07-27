<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_id' => [
                'required',
                'integer',
                Rule::exists('suppliers', 'supplier_id')
            ],

            'purchase_code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('purchases', 'product_code')
            ],

            'user_id' => [
                'required',
                'integer',
                Rule::exists('users', 'user_id')
            ],

            'purchase_date' => [
                'nullable',
                'date'
            ],

            'status' => [
                'nullable',
                'string',
                Rule::in(['Pending', 'Received', 'Cancelled'])
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

            'details.*.unit_cost' => [
                'required',
                'numeric',
                'min:0'
            ],
        ];
    }
}
