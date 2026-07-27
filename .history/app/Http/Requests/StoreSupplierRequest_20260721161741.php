<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('suppliers', 'category_code')
            ],

            'supplier_name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('suppliers', 'supplier_name')
            ],

            'contact_person' => [
                'nullable',
                'string',
                'max:100'
            ],

            'phone' => [
                'nullable',
                'string',
                'max:20'
            ],

            'email' => [
                'nullable',
                'email',
                'max:100'
            ],

            'address' => [
                'nullable',
                'string',
                'max:255'
            ]
        ];
    }
}
