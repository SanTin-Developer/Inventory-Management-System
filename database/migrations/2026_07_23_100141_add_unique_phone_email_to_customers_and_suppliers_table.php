<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->unique('phone', 'customers_phone_unique');
            $table->unique('email', 'customers_email_unique');
        });

        Schema::table('suppliers', function (Blueprint $table) {
            $table->unique('phone', 'suppliers_phone_unique');
            $table->unique('email', 'suppliers_email_unique');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropUnique('customers_phone_unique');
            $table->dropUnique('customers_email_unique');
        });

        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropUnique('suppliers_phone_unique');
            $table->dropUnique('suppliers_email_unique');
        });
    }
};
