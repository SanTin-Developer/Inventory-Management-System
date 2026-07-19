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
            'qr_code_url' => $qrCodeUrl,//render this a 
        ]);
    }
}
