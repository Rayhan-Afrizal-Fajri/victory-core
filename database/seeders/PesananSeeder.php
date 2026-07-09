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
        JobTicket::create(
            [
                'no_job_ticket' => 'VL-2026-001',
                'date' => '2026-06-22',
                'status' => 'Order Entry',
                'customer_id' => random_int(1, 4),
                'company_profile_id' => random_int(1, 3),
                'sales_name' => 'Salman',
                'deadline' => '2026-07-30',
                'created_by' => 1,
            ],
        );
        JobTicket::create(
            [
                'no_job_ticket' => 'VL-2026-002',
                'date' => '2026-06-22',
                'status' => 'Order Entry',
                'customer_id' => random_int(1, 4),
                'company_profile_id' => random_int(1, 3),
                'sales_name' => 'Faris',
                'deadline' => '2026-07-30',
                'customer_notes' => 'Sablon belakang besar',
                'created_by' => 1,
            ],
        );

        Pesanan::create(
            [
                'job_ticket_id' => random_int(1, 2),
                'produk' => 'Kaos Polo',
                'q' => 20,
                'keterangan_tambahan' => 'Sablon belakang besar',
            ],
        );
        Pesanan::create(
            [
                'job_ticket_id' => random_int(1, 2),
                'produk' => 'Kemeja Lapangan',
                'q' => 50,
                'keterangan_tambahan' => 'Sablon belakang besar',
            ],
        );
        Pesanan::create(
            [
                'job_ticket_id' => random_int(1, 2),
                'produk' => 'Kaos Oversize',
                'q' => 35,
                'keterangan_tambahan' => 'Sablon belakang besar',
            ],
        );
        Pesanan::create(
            [
                'job_ticket_id' => random_int(1, 2),
                'produk' => 'Warepack bengkel',
                'q' => 34,
                'keterangan_tambahan' => 'Sablon belakang besar',
            ],
        );

        $pesanans = Pesanan::all();

        foreach ($pesanans as $pesanan) {
            // Default Workflow Status
            $pesanan->workflowStatus()->create([
                // 'order_entry' => true,
                'design_uploaded' => false,
                'design_approved' => false,
            ]);
            $pesanan->jobTicket->workflowHistory()->create([
                'step' => 'order_entry',
                'action' => 'created',
                'user_id' => 1,
                'notes' => "Pesanan {$pesanan->produk} masuk dalam Job Ticket.",
            ]);

            PesananSizeBreakdown::create(
                [
                    'pesanan_id' => $pesanan->id,
                    'color' => 'Hitam',
                    'size_label' => 'All Size',
                    'fabric_spec' => '24s',
                    'qty' => $pesanan->q
                ]
            );
        }

    }
}
