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
        Schema::create('job_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('no_job_ticket');
            $table->date('date');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('customer_nama_snapshot')->nullable();
            $table->string('customer_perusahaan_snapshot')->nullable();
            $table->foreignId('company_profile_id')->nullable()->constrained('company_profiles')->nullOnDelete();
            $table->date('deadline');
            $table->text('customer_notes')->nullable();
            $table->string('status')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_tickets');
    }
};
