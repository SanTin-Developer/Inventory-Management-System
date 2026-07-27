    <?php

    use Illuminate\Database\Migrations\Migration;
    use Illuminate\Database\Schema\Blueprint;
    use Illuminate\Support\Facades\Schema;

    return new class extends Migration
    {
        /**
         * Run the migrations.
         */
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


        /**
         * Reverse the migrations.
         */
        public function down()
        {
            Schema::table('sales', function (Blueprint $table) {
                $table->dropForeign(['customer_id']);
                $table->dropColumn('customer_id');
            });
        }
    };
