<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('users', 'user_code')
            ],
            'name'           => 'required|string|max:150',
            'email'          => 'required|email|max:150|unique:users,email',
            'password'       => 'required|string|min:8',
            'department_id'  => 'nullable|integer|exists:departments,department_id',
            'role_id'        => 'required|integer|exists:roles,role_id',
            'phone'          => 'nullable|string|max:20',
            'status'         => 'nullable|string|max:20',
            'salary'         => 'nullable|numeric|min:0',
            'id_card_number' => 'nullable|string|max:50',
            'hire_date'      => 'nullable|date',
            'date_of_birth' => 'nullable|date',
            'address'        => 'nullable|string|max:255',
            // File upload — max 5MB, actual image only
            'image'          => 'nullable|image|max:5120',
        ];
    }
}
