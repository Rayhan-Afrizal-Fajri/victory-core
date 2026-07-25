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
        Schema::table('profit_loss', function (Blueprint $table) {
            
            // 1. Drop foreign constraint lama
            $table->dropForeign(['pesanan_id']);
            
            // 2. Buat foreign constraint baru dengan cascadeOnDelete
            // Cukup gunakan method foreign() pada kolom yang sudah ada
            $table->foreign('pesanan_id')
                  ->references('id')
                  ->on('pesanan')
                  ->cascadeOnDelete();
            
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('profit_loss', function (Blueprint $table) {
            
            // 1. Drop foreign constraint lama
            $table->dropForeign(['pesanan_id']);
            
            // 2. Buat foreign constraint baru dengan cascadeOnDelete
            // Cukup gunakan method foreign() pada kolom yang sudah ada
            $table->foreign('pesanan_id')
                  ->references('id')
                  ->on('pesanan');
            
        });
    }
};
