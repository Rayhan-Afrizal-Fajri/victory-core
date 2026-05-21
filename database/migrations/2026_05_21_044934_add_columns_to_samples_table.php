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
        Schema::table('samples', function (Blueprint $table) {
            $table->decimal('sample_price', 15, 2)->default(0)->after('qty');
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete()->after('sample_price');

            $table->text('customer_review_note')->nullable()->after('catatan');
            $table->text('internal_note')->nullable()->after('customer_review_note');

            $table->dateTime('created_sample_at')->nullable()->after('internal_note');
            $table->dateTime('paid_at')->nullable()->after('created_sample_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('samples', function (Blueprint $table) {
            $table->dropColumn([
                'sample_price',
                'invoice_id',
                'customer_review_note',
                'internal_note',
                'created_sample_at',
                'paid_at',
            ]);
        });
    }
};
