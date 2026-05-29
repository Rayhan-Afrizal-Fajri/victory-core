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
        Schema::create('purchasings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pesanan_id')->constrained('pesanan');
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->string('item_bahan');
            $table->decimal('qty_bahan', 10, 2);
            $table->string('satuan'); // kg, yard, pcs
            $table->decimal('harga_satuan', 15, 2)->default(0);
            $table->decimal('total_harga', 15, 2)->default(0);
            $table->boolean('is_received')->default(false);
            $table->date('tgl_pembelian')->nullable();

            $table->integer('received_qty')->default(0); // Qty yang sudah diterima
            $table->enum('status', ['draft', 'ordered', 'partial_received', 'received', 'cancelled'])->default('draft'); // Status pembelian berdasarkan penerimaan barang
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchasing');
    }
};
