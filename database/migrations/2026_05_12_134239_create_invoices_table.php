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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pesanan_id')->constrained('pesanan');
            $table->string('no_invoice')->unique();
            $table->enum('tipe_invoice', ['Sample', 'DP Produksi', 'Pelunasan']);
            $table->decimal('total_tagihan', 15, 2);
            $table->enum('status_tagihan', ['Unpaid', 'Partially Paid', 'Paid', 'Cancelled'])->default('Unpaid');
            $table->date('tgl_jatuh_tempo');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
