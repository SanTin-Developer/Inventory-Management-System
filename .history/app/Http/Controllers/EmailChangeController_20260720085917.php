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
                'errors' => ['password' => ['ពាក្យសម្ងាត់មិនត្រឹមត្រូវ']],
            ], 422);
        }

        // 2. Verify the TOTP (2FA) code
        if (! Google2FA::verifyKey($user->google2fa_secret, $request->two_factor_code)) {
            return response()->json([
                'errors' => ['two_factor_code' => ['កូដ 2FA មិនត្រឹមត្រូវ']],
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

        // 4. Send a confirmation email to the new e
        Mail::to($request->new_email)->send(new ConfirmNewEmail($token));
        Mail::to($user->email)->send(new EmailChangeRequestedNotice($request->new_email));

        return response()->json([
            'status' => 'សូមពិនិត្យអ៊ីមែលថ្មីរបស់អ្នកដើម្បី confirm',
        ]);
    }

    /**
     * Confirm ការប្តូរអ៊ីមែល — ចុចពី link ក្នុងអ៊ីមែលថ្មី
     */
    public function confirm(string $token)
    {
        $pending = PendingEmailChange::where('token', $token)
            ->where('expires_at', '>', now())
            ->first();

        if (! $pending) {
            return response()->json([
                'message' => 'Link នេះមិនត្រឹមត្រូវ ឬផុតកំណត់ហើយ',
            ], 404);
        }

        $user = $pending->user;
        $oldEmail = $user->email;

        $user->update(['email' => $pending->new_email]);
        // google2fa_secret មិនប៉ះពាល់ទេ — TOTP នៅតែដដែល

        $pending->delete();

        // Revoke គ្រប់ Sanctum tokens ទាំងអស់ — មិនមាន "session បច្ចុប្បន្ន" ត្រូវលើកលែងទេ
        // ព្រោះ route នេះជា public (link ចុចពី email client, គ្មាន auth session)
        $user->tokens()->delete();

        Mail::to($oldEmail)->send(new EmailChangedConfirmation());

        return response()->json([
            'status' => 'អ៊ីមែលបានប្តូរដោយជោគជ័យ',
        ]);
    }
}
