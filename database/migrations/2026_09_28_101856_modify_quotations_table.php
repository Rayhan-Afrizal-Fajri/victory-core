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
        Schema::table('quotations', function (Blueprint $table) {
            // Tambahkan ->change() untuk memodifikasi kolom yang sudah ada
            $table->enum('source_type', ['manual', 'job_ticket'])->default('job_ticket')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            // Kembalikan ke default awal ('manual') jika migration di-rollback, bukan di-drop
            $table->enum('source_type', ['manual', 'job_ticket'])->default('manual')->change();
        });
    }
};