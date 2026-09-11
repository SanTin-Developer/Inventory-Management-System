<?php

namespace App\Http\Requests;

use App\Models\Supplier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $supplier = $this->route('supplier');

        $supplierId = $supplier instanceof Supplier
            ? $supplier->supplier_id
            : $supplier;

        return [
            'supplier_name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('suppliers', 'supplier_name')->ignore($supplierId, 'supplier_id'),
            ],

            'contact_person' => [
                'nullable',
                'string',
                'max:100',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('suppliers', 'phone')->ignore($supplierId, 'supplier_id'),
            ],

            'email' => [
                'nullable',
                'email',
                'max:100',
                Rule::unique('suppliers', 'email')->ignore($supplierId, 'supplier_id'),
            ],

            'address' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }
}
