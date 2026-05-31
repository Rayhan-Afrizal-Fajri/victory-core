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
        Schema::table('purchasings', function (Blueprint $table) {
            $table->foreignId('pesanan_material_spec_id')
                ->nullable()
                ->constrained('pesanan_material_specs')
                ->nullOnDelete()
                ->after('pesanan_id');

            $table->decimal('required_qty', 15, 4)->default(0)->after('qty_bahan');
            $table->decimal('purchase_qty', 15, 4)->default(0)->after('required_qty');
            $table->decimal('stock_qty', 15, 4)->default(0)->after('purchase_qty');
            $table->decimal('leftover_qty', 15, 4)->default(0)->after('stock_qty');

            $table->string('purchase_scope')->default('sample_and_production')->after('status');
            $table->text('notes')->nullable()->after('purchase_scope');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchasings', function (Blueprint $table) {
            $table->dropForeign(['pesanan_material_spec_id']);
            $table->dropColumn('pesanan_material_spec_id');
            $table->dropColumn('required_qty');
            $table->dropColumn('purchase_qty');
            $table->dropColumn('stock_qty');
            $table->dropColumn('leftover_qty');
            $table->dropColumn('purchase_scope');
            $table->dropColumn('notes');
        });
    }
};
