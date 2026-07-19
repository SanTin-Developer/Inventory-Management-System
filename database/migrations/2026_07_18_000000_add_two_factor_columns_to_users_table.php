<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Encrypted TOTP secret. Nullable until the user enables 2FA.
            $table->text('two_factor_secret')->nullable()->after('password');

            // Set only once the user has scanned the QR code AND confirmed
            // a valid code — prevents users being "half enabled" if they
            // abandon setup partway through.
            $table->boolean('two_factor_enabled')->default(false)->after('two_factor_secret');

            // Recovery codes, JSON-encoded + encrypted, in case the user
            // loses their device. Generated once, shown once.
            $table->text('two_factor_recovery_codes')->nullable()->after('two_factor_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'two_factor_secret',
                'two_factor_enabled',
                'two_factor_recovery_codes',
            ]);
        });
    }
};
