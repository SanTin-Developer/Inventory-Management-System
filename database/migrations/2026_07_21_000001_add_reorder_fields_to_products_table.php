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
        Schema::table('products', function (Blueprint $table) {
            // How many days the supplier takes to deliver after a purchase is placed
            $table->unsignedInteger('lead_time_days')->default(7)->after('reorder_level');

            // Fixed cost of placing one purchase order (admin/shipping overhead)
            $table->decimal('order_cost', 10, 2)->default(10.00)->after('lead_time_days');

            // Annual cost of holding one unit in stock (storage, insurance, spoilage risk)
            $table->decimal('holding_cost', 10, 2)->default(1.00)->after('order_cost');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['lead_time_days', 'order_cost', 'holding_cost']);
        });
    }
};
