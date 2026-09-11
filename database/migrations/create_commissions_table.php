<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commissions', function (Blueprint $table) {
            $table->id('commission_id');

            // The sale this commission was earned on
            $table->unsignedBigInteger('sale_id');
            $table->foreign('sale_id')->references('sale_id')->on('sales')->onDelete('cascade');

            // The seller who earned it
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');

            // Snapshot values at the time of calculation — even if the
            // user's commission_rate changes later, historical records
            // stay accurate to what was actually earned.
            $table->decimal('sale_amount', 12, 2);
            $table->decimal('commission_rate', 5, 2);
            $table->decimal('commission_amount', 12, 2);

            $table->timestamps();

            // A sale should only ever generate one commission record
            $table->unique('sale_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commissions');
    }
};
