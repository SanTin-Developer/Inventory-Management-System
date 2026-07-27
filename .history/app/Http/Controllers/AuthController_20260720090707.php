<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Requests\LoginRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Password as PasswordFacade;

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
                'user_id' => $user->user_id,   \
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

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        // sendResetLink() itself checks whether the email exists — the
        // response message here is the SAME whether or not it does, so we
        // never reveal which emails are registered in the system.
        Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => 'If an account exists for that email, a reset link has been sent.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'This reset link is invalid or has expired.',
            ], 422);
        }

        return response()->json(['message' => 'Password has been reset.']);
    }
}
