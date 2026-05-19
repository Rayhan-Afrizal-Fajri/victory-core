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
        Schema::create('production_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pesanan_id')->constrained('pesanan')->onDelete('cascade');
            $table->enum('prioritas', ['Low', 'Medium', 'High', 'Urgent'])->default('Medium');
            
            // Gate Trigger
            $table->boolean('acc_sample')->default(false);
            $table->timestamp('tgl_acc_sample')->nullable(); //pemicu masuk ke fase produksi masal

            //poin-poin checklist sesuai gambar job ticket fisik
            //fase ppm
            $table->boolean('ppm_bahan')->default(false);
            $table->boolean('ppm_aksesoris')->default(false);
            $table->boolean('ppm_cutting')->default(false);
            $table->boolean('ppm_sablon')->default(false);
            $table->boolean('ppm_jahit')->default(false);

            //fase cutting
            $table->boolean('cut_test_susut')->default(false);
            $table->boolean('cut_test_luntur')->default(false);
            $table->boolean('cut_relax_bahan')->default(false);
            $table->boolean('cut_form_cutting')->default(false);
            $table->boolean('cut_label_potongan')->default(false);
            $table->boolean('cut_sisa_bahan')->default(false);

            //fase sablon / bordir
            $table->boolean('sablon_sample_warna')->default(false);
            $table->boolean('sablon_test_muntah')->default(false);

            //fase jahit
            $table->boolean('jahit_kelengkapan_aksesoris')->default(false);
            $table->boolean('jahit_titik_kritis')->default(false);
            $table->boolean('jahit_random_check')->default(false);
            
            //fase wc & packing
            $table->boolean('qc_steam_packing')->default(false);
            $table->boolean('qc_sampling_ukuran')->default(false);
            $table->boolean('qc_inspeksi_jahit')->default(false);
            $table->boolean('qc_surat_jalan')->default(false);
            
            //fase logistik
            $table->boolean('log_foto_confirm')->default(false);
            $table->boolean('log_random_cek')->default(false);
            $table->boolean('log_payment_delivery')->default(false);
            
            $table->string('status_produksi')->nullable(); // Detail task saat ini
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_progress');
    }
};
