<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $departmentId = $this->route('department');

        return [
            'department_name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('departments', 'department_name')->ignore($departmentId, 'department_id'),
            ],
            'description' => 'nullable|string|max:255',
        ];
    }
}
