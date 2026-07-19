<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_name' => 'required|string|max:150',
            'phone'         => 'nullable|string|max:20',
            'email'         => 'nullable|email|max:150',
            'address'       => 'nullable|string|max:255',
        ];
    }
}
