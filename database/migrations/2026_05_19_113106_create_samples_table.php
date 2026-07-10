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
        Schema::create('samples', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pesanan_id')->constrained('pesanan')->onDelete('cascade');

            $table->integer('qty'); // Qty Sample
            $table->enum('status', [
                'draft',
                'in_production',
                'completed',
                'in_delivery',
                'delivered',
                'approved',
                'revision_needed',
                'rejected',
            ])->default('draft'); // Status sample

            $table->text('catatan')->nullable(); // Catatan tambahan untuk sample

            $table->dateTime('sent_at')->nullable(); // Tanggal dan waktu ketika sample dikirim ke customer
            $table->dateTime('approved_at')->nullable(); // Tanggal dan waktu ketika sample disetujui oleh customer
            $table->foreignId('approved_by')->nullable()->constrained('users'); // Relasi ke tabel users untuk yang menyetujui sample (user customer atau admin)
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('samples');
    }
};
