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
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pesanan_id')
                ->constrained('pesanan')
                ->cascadeOnDelete();

            $table->string('quotation_number')->unique();

            $table->enum('status', [
                'draft',
                'sent',
                'approved',
                'rejected',
                'expired',
            ])->default('draft');

            $table->date('valid_until')->nullable();

            $table->text('payment_terms')->nullable();
            $table->text('delivery_terms')->nullable();
            $table->text('notes')->nullable();

            $table->decimal('price_per_pcs', 15, 2)->default(0);
            $table->integer('quantity')->default(0);

            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax', 15, 2)->default(0);
            $table->decimal('delivery_cost', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);

            $table->timestamp('approved_at')->nullable();
            $table->string('approved_by_name')->nullable();
            $table->string('signature_path')->nullable();

            $table->foreignId('created_by')
                ->nullable()
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
        Schema::dropIfExists('quotations');
    }
};
