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
        Schema::create('products', function (Blueprint $table) {
            $table->id('product_id');
            $table->foreignId('category_id')->nullable()->constrained('categories', 'category_id');
            $table->string('product_name');
            $table->string('product_code')->unique()->nullable();
            $table->decimal('unit_price', 12, 2);
            $table->decimal('cost_price', 12, 2);
            $table->integer('quantity_in_stock')->default(0);
            $table->integer('reorder_level')->default(0);
            $table->string('unit')->nullable();
            $table->timestamps();
            $table->integer('lead_time_days')->nullable();
            $table->decimal('order_cost', 12, 2)->nullable();
            $table->decimal('holding_cost', 12, 2)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
