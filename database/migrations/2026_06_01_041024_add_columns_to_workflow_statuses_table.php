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
        Schema::table('workflow_statuses', function (Blueprint $table) {
            $table->boolean('article_synced')->default(false)->after('design_approved');
            $table->boolean('design_specs_completed')->default(false)->after('article_synced');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workflow_statuses', function (Blueprint $table) {
            $table->dropColumn(['article_synced', 'design_specs_completed']);
        });
    }
};
