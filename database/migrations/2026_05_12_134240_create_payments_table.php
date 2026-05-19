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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->date('tgl_bayar');
            $table->decimal('jumlah_bayar', 15, 2);
            $table->string('metode_pembayaran');
            $table->string('bukti_transfer_path')->nullable();
            $table->text('catatan_finance')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users'); // Relasi ke tabel users untuk yang memverifikasi pembayaran (user finance atau admin)
            $table->dateTime('verified_at')->nullable(); // Tanggal dan waktu ketika pembayaran
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
