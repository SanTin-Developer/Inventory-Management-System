<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = $this->route('user');

        $userId = $user instanceof User
            ? $user->user_id
            : $user;

        return [
            'name' => 'sometimes|required|string|max:150',
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:150',
                Rule::unique('users', 'email')->ignore($userId, 'user_id'),
            ],
            'password' => 'nullable|string|min:8',
            'department_id' => 'nullable|integer|exists:departments,department_id',
            'role_id' => 'sometimes|required|integer|exists:roles,role_id',
            'phone' => 'nullable|string|max:20',
            'status' => 'nullable|string|max:20',
            'salary' => 'nullable|numeric|min:0',
            'id_card_number' => 'nullable|string|max:50',
            'hire_date' => 'nullable|date',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string|max:255',
            'image' => 'nullable|image|max:5120',
        ];
    }
}
