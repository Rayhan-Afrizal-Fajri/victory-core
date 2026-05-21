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
        Schema::create('sample_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sample_id')->constrained('samples')->cascadeOnDelete();

            $table->string('courier_name')->nullable(); //JNE, J&T, Grab, Gosend, internal Courier
            $table->string('tracking_number')->nullable();
            $table->string('tracking_url')->nullable();

            $table->enum('status', [
                'pending',
                'shiped',
                'delivered',
                'failed',
                'returned',
            ])->default('pending');

            $table->dateTime('sent_at')->nullable();
            $table->dateTime('received_at')->nullable();

            $table->text('delivery_note')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sample_deliveries');
    }
};
