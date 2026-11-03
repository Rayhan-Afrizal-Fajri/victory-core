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
        Schema::create('surat_jalans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_ticket_id')->constrained('job_tickets')->onDelete('cascade');
            $table->foreignId('pesanan_id')->nullable()->constrained('pesanan')->nullOnDelete();
            $table->foreignId('production_run_id')->nullable()->constrained('production_runs')->nullOnDelete();
            $table->string('surat_jalan_number', 50)->unique();
            $table->date('delivery_date');
            $table->foreignId('company_profile_id')->nullable()->constrained('company_profiles')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            
            // Snapshots
            $table->string('customer_name_snapshot', 150);
            $table->string('customer_company_snapshot', 150)->nullable();
            $table->string('customer_phone_snapshot', 50)->nullable();
            $table->text('customer_address_snapshot')->nullable();
            $table->string('customer_pic_snapshot', 100)->nullable();

            // Ekspedisi / Delivery Details
            $table->string('courier_name', 100)->nullable();
            $table->string('tracking_number', 100)->nullable();
            $table->string('tracking_url', 255)->nullable();
            $table->string('vehicle_number', 50)->nullable();
            $table->string('driver_name', 100)->nullable();
            $table->integer('total_quantity')->default(0);
            $table->text('notes')->nullable();
            
            // Status: ready_to_ship, in_transit, delivered
            $table->string('status', 30)->default('ready_to_ship');
            
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('printed_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->string('received_by_name', 100)->nullable();
            
            $table->timestamps();
        });

        Schema::create('surat_jalan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('surat_jalan_id')->constrained('surat_jalans')->onDelete('cascade');
            $table->foreignId('pesanan_id')->nullable()->constrained('pesanan')->nullOnDelete();
            $table->string('product_name', 150);
            $table->text('description')->nullable();
            $table->integer('quantity')->default(1);
            $table->string('unit', 30)->default('Pcs');
            $table->string('notes')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('surat_jalan_items');
        Schema::dropIfExists('surat_jalans');
    }
};
