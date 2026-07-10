<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Pesanan;
use App\Models\PesananSizeBreakdown;
use App\Models\JobTicket;

class PesananSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Daftar opsi produk dan sales untuk diacak
        $listProduk = ['Kaos Polo', 'Kemeja Lapangan', 'Kaos Oversize', 'Warepack bengkel', 'Jaket Parka'];
        $listSales = ['Salman', 'Faris', 'Rudi', 'Andi'];

        // Looping 13 kali untuk membuat 13 Job Ticket
        for ($i = 1; $i <= 13; $i++) {
            
            // Membuat format nomor berurutan: VL-2026-001, VL-2026-002, dst.
            $noUrut = str_pad($i, 3, '0', STR_PAD_LEFT);
            $noJobTicket = "VL-2026-{$noUrut}";

            // 1. Buat Job Ticket
            $jobTicket = JobTicket::create([
                'no_job_ticket' => $noJobTicket,
                'date' => '2026-06-22',
                'status' => 'Order Entry',
                'customer_id' => random_int(1, 4),
                'company_profile_id' => random_int(1, 3),
                'sales_name' => $listSales[array_rand($listSales)],
                'deadline' => '2026-07-30',
                'customer_notes' => 'Catatan pesanan untuk ' . $noJobTicket,
                'created_by' => 1,
            ]);

            // 2. Buat Tepat 1 Pesanan untuk Job Ticket ini
            $pesanan = Pesanan::create([
                'job_ticket_id' => $jobTicket->id, // Assign ID dari JobTicket yang baru dibuat
                'produk' => $listProduk[array_rand($listProduk)],
                'q' => random_int(20, 100), // Kuantitas diacak
                'keterangan_tambahan' => 'Sablon belakang besar',
            ]);

            // 3. Buat relasi Workflow Status
            $pesanan->workflowStatus()->create([
                // 'order_entry' => true,
                'design_uploaded' => false,
                'design_approved' => false,
            ]);

            // 4. Buat relasi Workflow History
            $jobTicket->workflowHistory()->create([
                'step' => 'order_entry',
                'action' => 'created',
                'user_id' => 1,
                'notes' => "Pesanan {$pesanan->produk} masuk dalam Job Ticket.",
            ]);

            // 5. Buat relasi Size Breakdown
            PesananSizeBreakdown::create([
                'pesanan_id' => $pesanan->id,
                'color' => 'Hitam',
                'size_label' => 'All Size',
                'fabric_spec' => '24s',
                'qty' => $pesanan->q
            ]);
        }
    }
}