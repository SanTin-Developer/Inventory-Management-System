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
        Schema::create('users', function (Blueprint $table) {
            $table->id('user_id');
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('phone')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->foreignId('department_id')->nullable()->constrained('departments', 'department_id');
            $table->foreignId('role_id')->nullable()->constrained('roles', 'role_id');
            $table->string('image_url')->nullable();
            $table->decimal('salary', 12, 2)->nullable();
            $table->string('id_card_number')->nullable();
            $table->date('hire_date')->nullable();
            $table->text('address')->nullable();
            $table->text('two_factor_secret')->nullable();
            $table->boolean('two_factor_enabled')->default(false);
            $table->text('two_factor_recovery_codes')->nullable();
            $table->decimal('commission_rate', 5, 2)->nullable();
            $table->string('user_code')->unique()->nullable();
            $table->date('date_of_birth')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
