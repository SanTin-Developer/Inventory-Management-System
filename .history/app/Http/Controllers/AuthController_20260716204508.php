<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Requests\LoginRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    // Login and issue a token
    public function login(LoginRequest $request)
    {
        $credentials = $request->validated();

        if (! Auth::attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password.'
            ], 401);
        }

        $user = User::where('email', $credentials['email'])->first()->load(['role', 'department']);
        
        if ($user->status === 'Inactive') {
            return response()->json([
                'success' => false,
                'message' => 'This account is inactive.'
            ], 403);
        }


        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data' => $user,
            'token' => $token
        ]);
    }

    // Return the currently authenticated user
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // Revoke current token
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.'
        ]);
    }
}
