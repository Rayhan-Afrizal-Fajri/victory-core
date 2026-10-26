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
        Schema::create('operational_expenses', function (Blueprint $table) {
            $table->id();
            $table->string('expense_number', 50)->unique();
            $table->foreignId('account_id')->constrained('chart_of_accounts'); // 6-xxxx expense account
            $table->foreignId('payment_account_id')->constrained('chart_of_accounts'); // 1-11xx cash/bank account
            $table->date('expense_date');
            $table->decimal('amount', 15, 2);
            $table->string('category', 100);
            $table->string('recipient', 150)->nullable();
            $table->text('description');
            $table->string('proof_path', 255)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('operational_expenses');
    }
};
