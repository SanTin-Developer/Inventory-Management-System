<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    /**
     * A bcrypt hash of a random password, used as a dummy comparison target
     * when the email is unknown so login timing doesn't reveal valid emails.
     */
    private const DUMMY_HASH = '$2y$12$e0MYzXyjpJS7Pd0RVvHwHeFxGIwrq7oF4Cyj4e9e40qXm5J9jW0om';

    // Login and issue a token
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::with('role')->where('email', $request->email)->first();

        if (! $user) {
            // Burn a comparable amount of CPU so responses are (near)uniform
            // whether or not the email exists in the system.
            Hash::check($request->password, self::DUMMY_HASH);

            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        // --- status gate ---
        // Block login for any status except Active.
        if ($user->status !== 'Active') {
            return response()->json([
                'message' => match ($user->status) {
                    'Inactive' => 'Your account is inactive. Please contact an administrator.',
                    'On Leave' => 'Your account is currently on leave and cannot log in.',
                    'Terminated' => 'This account has been terminated.',
                    default => 'Your account cannot log in at this time.',
                },
            ], 403);
        }

        // --- 2FA gate ---
        if ($user->two_factor_enabled) {
            return response()->json([
                'requires_2fa' => true,
                'user_id' => $user->user_id,
            ]);
        }

        // --- normal login path (2FA not enabled) ---
        $token = $user->createToken('auth_token')->plainTextToken;

        event(new Login('web', $user, false));

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    // Return the currently authenticated user (with role + department)
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // Authenticated user profile, including role and department relations
    public function profile(Request $request)
    {
        return response()->json($request->user()->load('role', 'department'));
    }

    // Permission matrix for the current user's role (drives UI visibility)
    public function permissions(Request $request)
    {
        $roleName = $request->user()?->role?->role_name;

        return response()->json(
            collect(array_keys(config('permissions')))
                ->mapWithKeys(fn (string $resource) => [
                    $resource => Permissions::level($resource, $roleName),
                ])
        );
    }

    // Revoke current token
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
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
