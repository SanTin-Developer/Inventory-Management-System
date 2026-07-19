<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $roleId = $this->route('role');

        return [
            'role_name' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('roles', 'role_name')->ignore($roleId, 'role_id'),
            ],
            'description' => 'nullable|string|max:255',
        ];
    }
}
