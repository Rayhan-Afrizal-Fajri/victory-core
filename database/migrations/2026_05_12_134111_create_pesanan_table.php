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
            $table->date('date');
            $table->string('no_job_ticket')->unique();
            $table->foreignId('customer_id')->constrained('customers');
            $table->string('produk'); // Nama Artikel
            $table->integer('q'); // Qty Produksi
            $table->integer('qs')->default(0); // Qty Sample
            $table->date('deadline');
            
            //Alur Divisi Aktif
            $table->enum('status_divisi', [
                'Penawaran', 'Quote', 'Sample', 'Blanks', 'CSA', 'Finance', 'Produksi', 'Pelunasan', 'Done', 'Cancel'
            ])->default('Penawaran');

            //finansial
            $table->decimal('harga_jual_per_pcs', 15, 2)->default(0);
            $table->decimal('estimasi_hpp_per_pcs', 15, 2)->default(0);

            //spesifikasi detail produk
            $table->text('spesifikasi_bahan')->nullable(); //eg: Combed 30s Black
            $table->text('spesifikasi_sablon_bordir')->nullable(); //eg: Plastisol 3 Warna
            $table->text('spesifikasi_aksesoris')->nullable(); //eg: Kancing snap, label woven
            $table->string('file_design_path')->nullable(); //link attachment gambar design (acc client)
            $table->text('keterangan_tambahan')->nullable();

            $table->foreignId('created_by')->constrained('users'); // CS atau Designer yang input
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
