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
        Schema::table('pesanan_size_breakdowns', function(Blueprint $table) {
            $table->decimal('harga_jual_per_pcs', 15,2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pesanan_size_breakdowns', function(Blueprint $table) {
            $table->dropColumn('harga_jual_per_pcs');
        });
    }
};
