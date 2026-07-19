<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'department_name' => 'required|string|max:100|unique:departments,department_name',
            'description'     => 'nullable|string|max:255',
        ];
    }
}
