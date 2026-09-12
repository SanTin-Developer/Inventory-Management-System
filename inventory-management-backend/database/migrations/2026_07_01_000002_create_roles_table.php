<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id('role_id');
            $table->string('role_name');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->decimal('default_salary_min', 12, 2)->nullable();
            $table->decimal('default_salary_max', 12, 2)->nullable();
            $table->string('role_code')->unique()->nullable();
            $table->string('user_code')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
