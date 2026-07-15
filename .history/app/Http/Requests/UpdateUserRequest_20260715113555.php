<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

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
            'name' => [
                'required',
                'string',
                'max:100'
            ],

            'email' => [
                'required',
                'email',
                'max:100',
                Rule::unique('users', 'email')->ignore($userId, 'user_id')
            ],

            // password optional on update — only validated/hashed if provided
            'password' => [
                'nullable',
                'string',
                Password::min(8)->mixedCase()->numbers()
            ],

            'role' => [
                'required',
                'string',
                Rule::in(['Admin', 'Staff', 'Manager'])
            ],

            'phone' => [
                'nullable',
                'string',
                'max:20'
            ],

            'status' => [
                'required',
                'string',
                Rule::in(['Active', 'Inactive'])
            ],
        ];
    }
}
