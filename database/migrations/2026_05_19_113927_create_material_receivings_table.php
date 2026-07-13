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
        Schema::create('material_receivings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchasing_id')->constrained('purchasings')->onDelete('cascade');
            $table->decimal('received_qty', 15, 4); // Qty yang diterima pada penerimaan barang ini
            $table->dateTime('received_at'); // Tanggal dan waktu ketika barang diterima
            $table->foreignId('checked_by')->constrained('users'); // Relasi ke user yang memeriksa barang yang diterima
            $table->enum('item_condition', ['good', 'damaged', 'expired'])->default('good'); // Kondisi barang yang diterima
            $table->text('notes')->nullable(); // Catatan tambahan untuk penerimaan barang
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('material_receivings');
    }
};
