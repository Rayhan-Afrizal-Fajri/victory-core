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
        Schema::table('pesanan', function (Blueprint $table) {
            $table->string('requested_product_name')->nullable()->after('produk');
            $table->text('customer_notes')->nullable()->after('keterangan_tambahan');

            $table->timestamp('article_synced_at')->nullable();
            $table->foreignId('article_synced_by')->nullable()
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pesanan', function (Blueprint $table) {
            $table->dropColumn(['requested_product_name', 'customer_notes', 'article_synced_at', 'article_synced_by']);
        });
    }
};
