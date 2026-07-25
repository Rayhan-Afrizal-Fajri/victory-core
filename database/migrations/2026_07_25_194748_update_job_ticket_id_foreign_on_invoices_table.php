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
        // Gunakan Schema::table karena tabel sudah ada
        Schema::table('invoices', function (Blueprint $table) {
            
            // 1. Drop foreign constraint lama
            $table->dropForeign(['job_ticket_id']);
            
            // 2. Buat foreign constraint baru dengan cascadeOnDelete
            // Cukup gunakan method foreign() pada kolom yang sudah ada
            $table->foreign('job_ticket_id')
                  ->references('id')
                  ->on('job_tickets')
                  ->cascadeOnDelete();
            
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Kembalikan ke kondisi semula (tanpa cascadeOnDelete)
        Schema::table('invoices', function (Blueprint $table) {
            
            // 1. Drop foreign constraint yang ada cascade-nya
            $table->dropForeign(['job_ticket_id']);
            
            // 2. Buat kembali foreign constraint tanpa cascade
            $table->foreign('job_ticket_id')
                  ->references('id')
                  ->on('job_tickets');
            
        });
    }
};