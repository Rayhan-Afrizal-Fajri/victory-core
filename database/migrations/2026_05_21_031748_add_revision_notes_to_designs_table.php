<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('designs', function (Blueprint $table) {
            $table->text('customer_revision_note')->nullable()->after('revision_note');
            $table->text('designer_revision_note')->nullable()->after('customer_revision_note');
        });
    }

    public function down(): void
    {
        Schema::table('designs', function (Blueprint $table) {
            $table->dropColumn([
                'customer_revision_note',
                'designer_revision_note',
            ]);
        });
    }
};
