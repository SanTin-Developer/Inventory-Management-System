<?php

namespace App\Http\Controllers;

use App\Mail\ConfirmNewEmail;
use App\Mail\EmailChangeRequestedNotice;
use App\Mail\EmailChangedConfirmation;
use App\Models\PendingEmailChange;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use PragmaRX\Google2FALaravel\Facade as Google2FA;

class EmailChangeController extends Controller
{
    /**
     * Request to change Email - Password and 2FA Verification Required
     */
    public function requestChange(Request $request)
    {
        $request->validate([
            'password' => ['required'],
            'new_email' => ['required', 'email', 'unique:users,email'],
            'two_factor_code' => ['required', 'digits:6'],
        ]);

        $user = $request->user();

        // 1. Verify the Password
        if (! Hash::check($request->password, $user->password)) {
            return response()->json([
                'errors' => ['password' => ['Incorrect password.']],
            ], 422);
        }

        // 2. Verify the TOTP (2FA) code
        if (! Google2FA::verifyKey($user->google2fa_secret, $request->two_factor_code)) {
            return response()->json([
                'errors' => ['two_factor_code' => ['Invalid 2FA code.']],
            ], 422);
        }

        // 3. Create a pending email change with a unique token.
        $token = Str::random(64);

        PendingEmailChange::updateOrCreate(
            ['user_id' => $user->id],
            [
                'new_email' => $request->new_email,
                'token' => $token,
                'expires_at' => now()->addHours(24),
            ]
        );

        // 4. Send a confirmation email to the new email address and a notification to the old email address
        Mail::to($request->new_email)->send(new ConfirmNewEmail($token));
        Mail::to($user->email)->send(new EmailChangeRequestedNotice($request->new_email));

        return response()->json([
            'status' => 'Please check your new email address to confirm the change.',
        ]);
    }

    /**
     * Confirm the email change by clicking the link sent to the new email address
     */
    public function confirm(string $token)
    {
        $pending = PendingEmailChange::where('token', $token)
            ->where('expires_at', '>', now())
            ->first();

        if (! $pending) {
            return response()->json([
                'message' => 'The link is invalid or has expired.',
            ], 404);
        }

        $user = $pending->user;
        $oldEmail = $user->email;

        $user->update(['email' => $pending->new_email]);
        // The google2fa_secretremains unchanged the existing TOTP setup continues to be used

        $pending->delete();

        // Revoke all Sanctum tokens there is no "current session" to exclude, 
        // because this route is public (the confirmation link is opened from the user's email client without an authenticated session).
        $user->tokens()->delete();

        Mail::to($oldEmail)->send(new EmailChangedConfirmation());

        return response()->json([
            'status' => 'Email changed success',
        ]);
    }
}
