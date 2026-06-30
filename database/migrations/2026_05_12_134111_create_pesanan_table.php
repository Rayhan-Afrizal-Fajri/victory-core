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
            $table->foreignId('job_ticket_id')->constrained('job_tickets')->cascadeOnDelete();
            // $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete(); //sync article

            // $table->string('customer_nama_snapshot');
            // $table->string('customer_perusahaan_snapshot')->nullable();

            // $table->foreignId('created_by')->constrained('users'); // CS atau Designer yang input
            // $table->date('date');
            // $table->string('no_job_ticket')->unique();
            $table->string('produk'); // Nama Artikel
            $table->string('requested_product_name')->nullable();
            $table->integer('q'); // Qty Produksi
            $table->integer('qs')->default(0); // Qty Sample
            $table->integer('sample_qty')->default(0);
            $table->date('deadline')->nullable();

            //finansial
            $table->decimal('harga_jual_per_pcs', 15, 2)->default(0);
            $table->decimal('estimasi_hpp_per_pcs', 15, 2)->default(0);

            $table->text('keterangan_tambahan')->nullable();
            // $table->text('customer_notes');
            $table->timestamp('article_synced_at')->nullable();
            $table->foreignId('article_synced_by')->nullable()
                ->constrained('users')
                ->nullOnDelete();
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
