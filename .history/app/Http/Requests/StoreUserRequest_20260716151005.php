<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
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
                Rule::unique('users', 'email')
            ],

            'password' => [
                'required',
                'string',
                Password::min(8)->mixedCase()->numbers()
            ],

            'role' => [
                'nullable',
                'string',
                Rule::in(['Admin', 'Staff', 'Manager'])
            ],

            'phone' => [
                'nullable',
                'string',
                'max:20'
            ],

            'status' => [
                'nullable',
                'string',
                Rule::in(['Active', 'Inactive'])
            ],
        ];
    }
}
