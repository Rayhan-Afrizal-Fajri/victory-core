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
        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pesanan_id')->constrained('pesanan')->onDelete('cascade');
            $table->enum('kategori', ['desain', 'invoice', 'qc', 'delivery', 'sample', 'payment']); //eg: invoice, desain, sample, dll
            
            $table->string('file_path'); // Path atau URL ke file attachment
            $table->foreignId('uploaded_by')->constrained('users'); // Relasi ke tabel users untuk yang mengupload attachment

            $table->text('catatan')->nullable(); // Catatan tambahan untuk attachment

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attachments');
    }
};
