<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Mengubah semua data lama yang 'manual' menjadi 'job_ticket'
        DB::table('quotations')
            ->where('source_type', 'manual')
            ->update(['source_type' => 'job_ticket']);
    }

    public function down(): void
    {
        // Jika di-rollback, kembalikan data ke 'manual'
        DB::table('quotations')
            ->where('source_type', 'job_ticket')
            ->update(['source_type' => 'manual']);
    }
};