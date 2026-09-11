<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\Login;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorController extends Controller
{
    protected Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA;
    }

    /**
     * Step 1 - generate a new secret  + QR code for the logged-in user.
     * This does NOT enable 2FA yet. Enabling happens only after
     * confirm() succeeds, so a user can't get locked into a half-setup
     * state.
     */
    public function setup(Request $request)
    {
        $user = $request->user();

        \Log::info('2FA setup called', ['user_id' => $user->user_id, 'was_enabled' => $user->two_factor_enabled]);

        if ($user->two_factor_enabled) {
            return response()->json(['message' => '2FA is already enabled. Disable it first to reconfigure.'], 400);
        }

        $secret = $this->google2fa->generateSecretKey();

        $user->two_factor_secret = $secret;
        $user->save();

        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name', 'Inventory'),
            $user->email,
            $secret
        );

        return response()->json([
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
        ]);
    }

    /**
     * Step 2 — user enters the 6-digit code from their authenticator app
     * to confirm setup. Only now do we flip two_factor_enabled to true
     * and generate recovery codes.
     */
    public function confirm(Request $request)
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = $request->user();

        if (! $user->two_factor_secret) {
            return response()->json(['message' => 'No 2FA setup in progress.'], 400);
        }

        $valid = $this->google2fa->verifyKey($user->two_factor_secret, $request->code);

        if (! $valid) {
            return response()->json(['message' => 'Invalid code. Please try again.'], 422);
        }

        $recoveryCodes = collect(range(1, 8))
            ->map(fn () => Str::upper(Str::random(4).'-'.Str::random(4)))
            ->all();

        // Save in two separate calls to avoid potential type-mismatch
        // issues when batching boolean with long encrypted text columns.
        $user->two_factor_recovery_codes = $recoveryCodes;
        $user->save();

        $user->two_factor_enabled = 1; // integer — matches the column's INT type
        $user->save();

        return response()->json([
            'message' => '2FA enabled.',
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Verify a code during LOGIN (after password check passes).
     * Called from your login flow, not from a logged-in "settings" screen.
     */
    public function verify(Request $request)
    {
        $request->validate([
            'user_id' => ['required', 'integer'],
            'code' => ['required', 'string'],
        ]);

        $user = User::findOrFail($request->user_id);

        if ($user->status !== 'Active') {
            return response()->json(['message' => 'This account cannot log in at this time.'], 403);
        }

        if (! $user->two_factor_enabled || ! $user->two_factor_secret) {
            return response()->json(['message' => '2FA is not enabled for this account.'], 400);
        }

        // Accept either a TOTP code or a recovery code.
        $isValidTotp = strlen($request->code) === 6
            && $this->google2fa->verifyKey($user->two_factor_secret, $request->code);

        $isValidRecovery = false;
        if (! $isValidTotp) {
            $recoveryCodes = $user->two_factor_recovery_codes ?? [];
            $normalizedInput = Str::upper(trim($request->code));
            if (in_array($normalizedInput, $recoveryCodes, true)) {
                $isValidRecovery = true;
                // Burn the used recovery code - single use only.
                $user->two_factor_recovery_codes = array_values(
                    array_diff($recoveryCodes, [$normalizedInput])
                );
                $user->save();
            }
        }

        if (! $isValidTotp && ! $isValidRecovery) {
            return response()->json([
                'message' => 'Invalid code.',
            ], 422);
        }

        // Issue the real auth token now that 2FA has passed.
        $token = $user->createToken('auth_token')->plainTextToken;

        event(new Login('web', $user, false));

        return response()->json([
            'token' => $token,
            'user' => $user->load('role', 'department'),
        ]);
    }

    /**
     * Disabled 2FA - requires the current password as re-auth, not just
     * being logged in, since this lowers the account's security bar.
     */
    public function disable(Request $request)
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Incorrect password.'], 422);
        }

        // Same split-save pattern as confirm() — avoid batching mixed
        // column types in one UPDATE statement.
        $user->two_factor_secret = null;
        $user->two_factor_recovery_codes = null;
        $user->save();

        $user->two_factor_enabled = 0;
        $user->save();

        return response()->json(['message' => '2FA disabled.']);
    }
}
