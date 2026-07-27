<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('products', 'product_code')
            ],
            'department_name' => 'required|string|max:100|unique:departments,department_name',
            'description'     => 'nullable|string|max:255',
        ];
    }
}
