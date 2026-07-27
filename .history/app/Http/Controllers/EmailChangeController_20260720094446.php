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
use PragmaRX\Google2FA\Google2FA;

class EmailChangeController extends Controller
{
    protected Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    public function requestChange(Request $request)
    {
        $request->validate([
            'password' => ['required'],
            'new_email' => ['required', 'email', 'unique:users,email'],
            'two_factor_code' => ['required', 'digits:6'],
        ]);

        $user = $request->user();

        if (! Hash::check($request->password, $user->password)) {
            return response()->json([
                'errors' => ['password' => ['Incorrect password.']],
            ], 422);
        }

        if (! $user->two_factor_enabled || ! $user->two_factor_secret) {
            return response()->json([
                'message' => '2FA is not enabled for this account.',
            ], 400);
        }

        // correct field is two_factor_secret, not google2fa_secret
        if (! $this->google2fa->verifyKey($user->two_factor_secret, $request->two_factor_code)) {
            return response()->json([
                'errors' => ['two_factor_code' => ['Invalid 2FA code.']],
            ], 422);
        }

        $token = Str::random(64);

        PendingEmailChange::updateOrCreate(
            ['user_id' => $user->user_id],
            [
                'new_email' => $request->new_email,
                'token' => $token,
                'expires_at' => now()->addHours(24),
            ]
        );

        Mail::to($request->new_email)->send(new ConfirmNewEmail($token));
        Mail::to($user->email)->send(new EmailChangeRequestedNotice($request->new_email));

        return response()->json([
            'status' => 'Check your new email address to confirm the change.',
        ]);
    }

    public function confirm(string $token)
    {
        $pending = PendingEmailChange::where('token', $token)
            ->where('expires_at', '>', now())
            ->first();

        if (! $pending) {
            return response()->json([
                'message' => 'This link is invalid or has expired.',
            ], 404);
        }

        $user = $pending->user;
        $oldEmail = $user->email;

        $user->update(['email' => $pending->new_email]);
        // two_factor_secret is untouched — TOTP setup stays the same

        $pending->delete();

        $user->tokens()->delete();

        Mail::to($oldEmail)->send(new EmailChangedConfirmation());

        return response()->json([
            'status' => 'Email changed successfully.',
        ]);
    }
}
