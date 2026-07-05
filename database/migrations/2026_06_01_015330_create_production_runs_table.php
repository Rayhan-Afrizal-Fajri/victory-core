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
        Schema::create('production_runs', function (Blueprint $table) {
            $table->id();

            // $table->foreignId('job_ticket_id')
            //     ->constrained('job_tickets')
            //     ->cascadeOnDelete();

            $table->foreignId('pesanan_id')
                ->constrained('pesanan')
                ->cascadeOnDelete();

            $table->enum('type', ['sample', 'production']);

            $table->enum('status', [
                'draft',
                'in_progress',
                'waiting_qc',
                'qc_completed',
                'packed',
                'in_delivery',
                'delivered',
                'approved',
                'revision_needed',
                'rejected',
                'completed',
            ])->default('draft');

            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->boolean('packing_completed')->default(false);
            $table->timestamp('packed_at')->nullable();
            $table->text('packing_notes')->nullable();

            $table->string('courier_name')->nullable();
            $table->string('tracking_number')->nullable();
            $table->string('tracking_url')->nullable();
            $table->text('delivery_note')->nullable();
            $table->timestamp('delivered_at')->nullable();

            $table->text('customer_review_note')->nullable();
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_runs');
    }
};
