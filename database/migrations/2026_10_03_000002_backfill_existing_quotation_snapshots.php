<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('quotations as q')
            ->join('job_tickets as jt', 'jt.id', '=', 'q.job_ticket_id')
            ->leftJoin('customers as c', 'c.id', '=', 'jt.customer_id')
            ->update([
                'q.customer_id' => DB::raw('COALESCE(q.customer_id, jt.customer_id)'),
                'q.company_profile_id' => DB::raw('COALESCE(q.company_profile_id, jt.company_profile_id)'),
                'q.customer_name_snapshot' => DB::raw("COALESCE(NULLIF(q.customer_name_snapshot, ''), jt.customer_nama_snapshot, c.nama)"),
                'q.customer_company_snapshot' => DB::raw("COALESCE(NULLIF(q.customer_company_snapshot, ''), jt.customer_perusahaan_snapshot, c.nama_perusahaan)"),
                'q.customer_phone_snapshot' => DB::raw('COALESCE(q.customer_phone_snapshot, c.no_hp)'),
                'q.customer_address_snapshot' => DB::raw("COALESCE(q.customer_address_snapshot, CONCAT_WS(', ', NULLIF(c.alamat_detail, ''), NULLIF(c.kelurahan, ''), NULLIF(c.kecamatan, ''), NULLIF(c.kota, ''), NULLIF(c.provinsi, ''), NULLIF(c.kode_pos, '')))") ,
            ]);

        DB::table('quotation_items as qi')
            ->join('pesanan as p', 'p.id', '=', 'qi.pesanan_id')
            ->update([
                'qi.sample_quantity' => DB::raw('COALESCE(p.sample_qty, 0)'),
                'qi.sample_price_per_pcs' => DB::raw('COALESCE(p.harga_sample_per_pcs, 0)'),
            ]);
    }

    public function down(): void
    {
        // Snapshot backfills are intentionally retained on rollback.
    }
};