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
        Schema::create('workflow_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_ticket_id')->constrained('job_tickets')->onDelete('cascade');

            $table->string('step'); //eg: order_received, design_uploaded, sample_sent, production_started, etc.
            $table->string('action'); //eg: created, updated, approved, rejected, etc.

            $table->foreignId('user_id')->constrained('users'); // Relasi ke tabel users untuk yang melakukan aksi
            $table->text('notes')->nullable(); // Catatan tambahan untuk histori workflow
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('work_flow_histories');
    }
};
