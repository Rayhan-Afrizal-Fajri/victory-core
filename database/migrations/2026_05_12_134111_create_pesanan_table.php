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
        Schema::create('pesanan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers');
            $table->foreignId('created_by')->constrained('users'); // CS atau Designer yang input
            $table->date('date');
            $table->string('no_job_ticket')->unique();
            $table->string('produk'); // Nama Artikel
            $table->integer('q'); // Qty Produksi
            $table->integer('qs')->default(0); // Qty Sample
            $table->date('deadline');

            //finansial
            $table->decimal('harga_jual_per_pcs', 15, 2)->default(0);
            $table->decimal('estimasi_hpp_per_pcs', 15, 2)->default(0);

            $table->text('keterangan_tambahan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pesanan');
    }
};
