<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Performance indexes for the most frequently filtered / joined /
     * searched columns. The pg_trgm GIN indexes (PostgreSQL only) turn the
     * wildcard LIKE searches used across the API into index scans instead of
     * full table scans.
     */
    public function up(): void
    {
        // Reports / stats filter by date range and status.
        Schema::table('purchases', function (Blueprint $table) {
            $table->index('status', 'idx_purchases_status');
            $table->index(['purchase_date', 'status'], 'idx_purchases_date_status');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->index('status', 'idx_sales_status');
            $table->index(['sale_date', 'status'], 'idx_sales_date_status');
            $table->index('payment_method', 'idx_sales_payment_method');
        });

        // Audit-log browsing and lookups.
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index(['auditable_type', 'auditable_id'], 'idx_audit_logs_auditable');
            $table->index('created_at', 'idx_audit_logs_created_at');
        });

        // Email-change requests are looked up by user and pruned by expiry.
        Schema::table('pending_email_changes', function (Blueprint $table) {
            $table->index('user_id', 'idx_pending_email_user');
            $table->index('expires_at', 'idx_pending_email_expires');
        });

        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        // stock_history only exists on PostgreSQL (created by the converted
        // DB-objects migration).
        Schema::table('stock_history', function (Blueprint $table) {
            $table->index('product_id', 'idx_stock_history_product');
            $table->index('created_at', 'idx_stock_history_created_at');
        });

        $this->addTrigramSearchIndexes();
    }

    /**
     * pg_trgm GIN indexes speed up the %term% LIKE searches used by the
     * product/supplier/customer/category/user endpoints. Enabled only when
     * the extension is available (managed providers such as Supabase allow
     * it); otherwise skipped with a warning rather than failing the deploy.
     */
    private function addTrigramSearchIndexes(): void
    {
        try {
            DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
        } catch (Throwable $e) {
            Log::warning('pg_trgm unavailable, skipping trigram search indexes: '.$e->getMessage());

            return;
        }

        DB::unprepared('
            CREATE INDEX IF NOT EXISTS idx_products_name_trgm
                ON products USING gin (product_name gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_products_code_trgm
                ON products USING gin (product_code gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_categories_name_trgm
                ON categories USING gin (category_name gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_suppliers_name_trgm
                ON suppliers USING gin (supplier_name gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_customers_name_trgm
                ON customers USING gin (customer_name gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_sales_customer_name_trgm
                ON sales USING gin (customer_name gin_trgm_ops);
            CREATE INDEX IF NOT EXISTS idx_users_name_trgm
                ON users USING gin (name gin_trgm_ops);
        ');
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropIndex('idx_purchases_status');
            $table->dropIndex('idx_purchases_date_status');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex('idx_sales_status');
            $table->dropIndex('idx_sales_date_status');
            $table->dropIndex('idx_sales_payment_method');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('idx_audit_logs_auditable');
            $table->dropIndex('idx_audit_logs_created_at');
        });

        Schema::table('pending_email_changes', function (Blueprint $table) {
            $table->dropIndex('idx_pending_email_user');
            $table->dropIndex('idx_pending_email_expires');
        });

        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        Schema::table('stock_history', function (Blueprint $table) {
            $table->dropIndex('idx_stock_history_product');
            $table->dropIndex('idx_stock_history_created_at');
        });

        DB::statement('DROP INDEX IF EXISTS idx_products_name_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_products_code_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_categories_name_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_suppliers_name_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_customers_name_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_sales_customer_name_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_users_name_trgm');
    }
};
