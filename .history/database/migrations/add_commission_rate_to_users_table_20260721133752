<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Percentage of each completed sale this user earns as commission.
            // e.g. 5.00 means 5%. Defaults to 0 so non-sales staff simply earn nothing.
            $table->decimal('commission_rate', 5, 2)->default(0)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('commission_rate');
        });
    }
};