<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorController extends Controller
{
    protected Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
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

        $secret = $this->google2fa->generateSecretKey();

        // Store the (unconfirmed) secret so confirm() can verify against it.
        // two_factor_enabled stays false until confirm() succeeds.
        $user->two_factor_secret = $secret;
        $user->save();

        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name', 'Inventory'),
            $user->email,
            $secret
        );

        return response()->json([
            'secret' => $secret,        //show as manual-entry fallback
            'qr_code_url' => $qrCodeUrl, //render this into a QR code on the frontend
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

        if (!$user->two_factor_secret) {
            return response()->json([
                'message' => 'No 2FA setup in progress.'
            ], 400);
        }

        $valid = $this->google2fa->verifyKey($user->two_factor_secret, $request->code);

        if (!$valid) {
            return response()->json([
                'message' => 'Invalid code. Please try again.'
            ], 422);
        }

        $recoveryCodes = collect(range(1, 8))
            ->map(fn() => Str::upper(Str::random(4) . '-' . Str::random(4)))
            ->all();

        $user->two_factor_enabled = true;
        $user->two_recovery_codes = $recoveryCodes;
        $user->save();

        return response()->json([
            'message' => '2FA enabled.',
            'recovery_codes' => $recoveryCodes, // show ONCE - tell the user to save these
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
            'code' => ['required', 'string']
        ]);

        $user = User::findOrFail($request->user_id);

        if (!$user->two_factor_enabled || !$user->two_factor_secret){
            return response()->json(['message'=> '2FA is not enabled for this account.'], 400);
        }

        // Accept either a TOTP code or a recovery code.
        $isValidTotp = strlen($request->code)===6
            && $this -> google2fa->verifyKey($user->two_factor_secret, $request->code);

        $isValidRecovery = false;
        if (!$isValidTotp){
            $recoveryCodes = $user -> two_factor_recovery_codes ?? [];
            $normalizedInput = Str::upper(trim($request->code));
            if (in_array($normalizedInput, $recoveryCodes, true)){
                $isValidRecovery = true
            }
        }
    }
}
