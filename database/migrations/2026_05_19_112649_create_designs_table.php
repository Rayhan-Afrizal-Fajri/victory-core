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
        Schema::create('designs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pesanan_id')->constrained('pesanan')->onDelete('cascade');
            $table->foreignId('designer_id')->constrained('users'); // Relasi ke tabel users untuk designer

            $table->string('file_path'); // Path atau URL ke file desain
            $table->string('revision_note')->nullable(); // Catatan revisi dari designer

            $table->enum('status', ['draft', 'waiting_approval', 'revision_needed', 'approved', 'rejected'])->default('draft'); // Status desain
            $table->dateTime('uploaded_at')->nullable(); // Tanggal dan waktu ketika desain diupload
            $table->dateTime('approved_at')->nullable(); // Tanggal dan waktu ketika desain disetujui
            $table->foreignId('approved_by')->nullable()->constrained('users'); // Relasi ke tabel users untuk yang menyetujui desain (user customer atau admin)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('designs');
    }
};
