<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('delivery_cost', 15, 2)->default(0)->after('total_tagihan');
        });

        DB::table('invoices')
            ->whereIn('kategori_invoice', ['sample', 'production', 'produksi', 'dp_produksi'])
            ->whereNotIn('status_tagihan', ['cancelled'])
            ->orderBy('id')
            ->get(['id', 'job_ticket_id', 'kategori_invoice', 'status_tagihan', 'total_tagihan'])
            ->each(function ($invoice) {
                $deliveryCost = (float) DB::table('quotations')
                    ->where('job_ticket_id', $invoice->job_ticket_id)
                    ->where('status', 'approved')
                    ->orderByDesc('id')
                    ->value('delivery_cost');

                if ($deliveryCost <= 0) {
                    return;
                }

                $updates = ['delivery_cost' => $deliveryCost];
                if (
                    $invoice->kategori_invoice === 'sample'
                    && in_array($invoice->status_tagihan, ['unpaid', 'partially_paid'], true)
                ) {
                    $updates['total_tagihan'] = (float) $invoice->total_tagihan + $deliveryCost;
                }

                DB::table('invoices')->where('id', $invoice->id)->update($updates);
            });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('delivery_cost');
        });
    }
};
