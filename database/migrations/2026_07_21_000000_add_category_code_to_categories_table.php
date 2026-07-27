<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: add as nullable first — existing rows have no value yet,
        // so we can't enforce NOT NULL until after backfilling them.
        Schema::table('categories', function (Blueprint $table) {
            $table->string('category_code', 50)->nullable()->after('category_name');
        });

        // Step 2: backfill existing categories with a generated code
        // (same "C-{id}" pattern used for new ones going forward).
        DB::statement("UPDATE categories SET category_code = 'C-' || category_id WHERE category_code IS NULL");

        // Step 3: now that every row has a value, enforce NOT NULL + unique.
        DB::statement('ALTER TABLE categories MODIFY category_code VARCHAR2(50) NOT NULL');
        DB::statement('ALTER TABLE categories ADD CONSTRAINT uq_categories_category_code UNIQUE (category_code)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE categories DROP CONSTRAINT uq_categories_category_code');

        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('category_code');
        });
    }
};
