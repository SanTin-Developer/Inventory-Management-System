<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('customers', 'customer_code')
            ],
            'customer_name' => 'required|string|max:150',
            'phone'         => 'nullable|string|max:20',
            'email'         => 'nullable|email|max:150',
            'address'       => 'nullable|string|max:255',
        ];
    }
}
