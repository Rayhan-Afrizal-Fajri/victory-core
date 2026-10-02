<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchasings', function (Blueprint $table) {
            $table->timestamp('production_ordered_at')->nullable()->after('purchase_scope');
            $table->foreignId('production_ordered_by')
                ->nullable()
                ->after('production_ordered_at')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('purchasings', function (Blueprint $table) {
            $table->dropForeign(['production_ordered_by']);
            $table->dropColumn(['production_ordered_at', 'production_ordered_by']);
        });
    }
};