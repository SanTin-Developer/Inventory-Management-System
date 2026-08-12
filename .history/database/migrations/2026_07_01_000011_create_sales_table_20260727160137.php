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
        Schema::create('sales', function (Blueprint $table) {
            $table->id('sale_id');
            $table->foreignId('user_id')->constrained('users', 'user_id');
            $table->string('customer_name')->nullable();
            $table->date('sale_date');
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->string('payment_method')->nullable();
            $table->string('status')->default('completed');
            $table->timestamps();
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->foreignId('customer_id')->nullable()->constrained('customers', 'customer_id');
            $table->string('sale_code')->unique()->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
