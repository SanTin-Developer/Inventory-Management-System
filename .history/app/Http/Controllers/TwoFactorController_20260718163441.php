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
     */



}
