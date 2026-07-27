public function up()
{
    Schema::table('sales', function (Blueprint $table) {
        $table->foreignId('customer_id')
              ->nullable()
              ->after('user_id')
              ->constrained('customers', 'customer_id')
              ->nullOnDelete();
    });
}

public function down()
{
    Schema::table('sales', function (Blueprint $table) {
        $table->dropForeign(['customer_id']);
        $table->dropColumn('customer_id');
    });
}