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
        Schema::create('profit_loss', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pesanan_id')->constrained('pesanan');
            $table->decimal('total_pendapatan', 15, 2)->default(0); // Total dari Invoice Produksi + Sample yang paid
            $table->decimal('hpp_realisasi', 15, 2)->default(0);    // Total pengeluaran dari tabel purchasing + biaya operasional harian
            $table->decimal('gop', 15, 2)->default(0);              // Gross Operating Profit (Pendapatan - HPP)
            $table->decimal('margin_persentase', 5, 2)->default(0); // Persentase keuntungan
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profit_loss');
    }
};
