<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->decimal('default_salary_min', 10, 2)->nullable()->after('role_name');
            $table->decimal('default_salary_max', 10, 2)->nullable()->after('default_salary_min');
        });
    }

    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn(['default_salary_min', 'default_salary_max']);
        });
    }
};
