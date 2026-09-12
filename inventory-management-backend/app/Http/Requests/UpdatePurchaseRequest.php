<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePurchaseRequest extends FormRequest
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
                Rule::exists('suppliers', 'supplier_id'),
            ],

            'user_id' => [
                'required',
                'integer',
                Rule::exists('users', 'user_id'),
            ],

            'purchase_date' => [
                'nullable',
                'date',
            ],

            'status' => [
                'required',
                'string',
                Rule::in(['Pending', 'Received', 'Cancelled']),
            ],

            // Optional: if provided, replaces all existing line items
            'details' => [
                'sometimes',
                'array',
                'min:1',
            ],

            'details.*.product_id' => [
                'required_with:details',
                'integer',
                Rule::exists('products', 'product_id'),
            ],

            'details.*.quantity' => [
                'required_with:details',
                'integer',
                'min:1',
            ],

            'details.*.unit_cost' => [
                'required_with:details',
                'numeric',
                'min:0',
            ],
        ];
    }
}
