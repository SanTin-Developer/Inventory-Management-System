<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Requests\LoginRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    // Login and issue a token
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = \App\Models\User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        // --- 2FA gate ---
        // If the user has 2FA enabled, do NOT issue a token yet.
        // Instead tell the frontend to prompt for a code, referencing
        // the user by ID so /2fa/verify knows whose secret to check.
        if ($user->two_factor_enabled) {
            return response()->json([
                'requires_2fa' => true,
                'user_id' => $user->id,
            ]);
        }

        // --- normal login path (2FA not enabled) ---
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
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
