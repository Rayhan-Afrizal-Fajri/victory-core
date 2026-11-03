<?php

namespace Database\Seeders;

use App\Models\Kpi\KpiDefinition;
use Illuminate\Database\Seeder;

class KpiDefinitionSeeder extends Seeder
{
    public function run(): void
    {
        $definitions = [
            [
                'code' => 'OTD_RATE',
                'name' => 'On-Time Delivery Rate (OTD)',
                'category' => 'production',
                'unit' => '%',
                'calculation_method' => '(po_tepat_waktu / total_po_selesai) * 100',
                'target_value' => 95.00,
                'warning_threshold' => 90.00,
                'danger_threshold' => 85.00,
                'description' => 'Persentase pengiriman pesanan produksi yang selesai tepat waktu sesuai deadline.',
            ],
            [
                'code' => 'CYCLE_TIME',
                'name' => 'Average Production Cycle Time',
                'category' => 'production',
                'unit' => 'hari',
                'calculation_method' => 'avg(tgl_kirim - tgl_dp_verified)',
                'target_value' => 14.00,
                'warning_threshold' => 18.00,
                'danger_threshold' => 21.00,
                'description' => 'Rata-rata hari dari verifikasi pembayaran DP sampai pesanan selesai dipacking/kirim.',
            ],
            [
                'code' => 'THROUGHPUT_DAILY',
                'name' => 'Throughput Harian Pabrik',
                'category' => 'production',
                'unit' => 'pcs',
                'calculation_method' => 'sum(qty_completed) / active_days',
                'target_value' => 250.00,
                'warning_threshold' => 200.00,
                'danger_threshold' => 150.00,
                'description' => 'Kapasitas produksi harian yang berhasil diselesaikan di lantai kerja.',
            ],
            [
                'code' => 'DEFECT_RATE',
                'name' => 'Defect / Scrap Rate',
                'category' => 'quality',
                'unit' => '%',
                'calculation_method' => '(sum(defect_qty) / sum(checked_qty)) * 100',
                'target_value' => 2.50,
                'warning_threshold' => 4.00,
                'danger_threshold' => 6.00,
                'description' => 'Tingkat kerusakan barang pada proses inspeksi QC.',
            ],
            [
                'code' => 'FTPR_PCT',
                'name' => 'First Time Pass Rate (FTPR)',
                'category' => 'quality',
                'unit' => '%',
                'calculation_method' => '(sum(passed_initial) / sum(checked_initial)) * 100',
                'target_value' => 97.00,
                'warning_threshold' => 94.00,
                'danger_threshold' => 90.00,
                'description' => 'Persentase produk yang langsung lolos QC pertama tanpa rework.',
            ],
            [
                'code' => 'GPM_PCT',
                'name' => 'Gross Profit Margin (GPM)',
                'category' => 'financial',
                'unit' => '%',
                'calculation_method' => '((revenue - cogs_actual) / revenue) * 100',
                'target_value' => 35.00,
                'warning_threshold' => 28.00,
                'danger_threshold' => 20.00,
                'description' => 'Margin laba kotor riil dari pesanan yang selesai.',
            ],
            [
                'code' => 'COST_VARIANCE',
                'name' => 'Cost Variance (BOM vs Riil)',
                'category' => 'financial',
                'unit' => '%',
                'calculation_method' => '((cogs_actual - cogs_estimated) / cogs_estimated) * 100',
                'target_value' => 0.00,
                'warning_threshold' => 5.00,
                'danger_threshold' => 10.00,
                'description' => 'Deviasi biaya produksi sesungguhnya dibanding estimasi penawaran.',
            ],
            [
                'code' => 'DSO_DAYS',
                'name' => 'Days Sales Outstanding (DSO)',
                'category' => 'financial',
                'unit' => 'hari',
                'calculation_method' => '(piutang_berjalan / total_penjualan) * 30',
                'target_value' => 14.00,
                'warning_threshold' => 21.00,
                'danger_threshold' => 30.00,
                'description' => 'Rata-rata waktu yang dibutuhkan untuk menagih piutang pelanggan.',
            ],
            [
                'code' => 'WIN_RATE',
                'name' => 'Quotation Win Rate',
                'category' => 'commercial',
                'unit' => '%',
                'calculation_method' => '(approved_quotes / (approved + rejected)) * 100',
                'target_value' => 70.00,
                'warning_threshold' => 55.00,
                'danger_threshold' => 40.00,
                'description' => 'Tingkat konversi penawaran harga menjadi pesanan produksi.',
            ],
            [
                'code' => 'AOV_VAL',
                'name' => 'Average Order Value (AOV)',
                'category' => 'commercial',
                'unit' => 'IDR',
                'calculation_method' => 'sum(invoices) / total_orders',
                'target_value' => 15000000.00,
                'warning_threshold' => 10000000.00,
                'danger_threshold' => 5000000.00,
                'description' => 'Nilai rata-rata per transaksi pesanan pelanggan.',
            ],
            [
                'code' => 'MATERIAL_REJECT',
                'name' => 'Material Reject Rate',
                'category' => 'purchasing',
                'unit' => '%',
                'calculation_method' => '(damaged_received / total_received) * 100',
                'target_value' => 1.00,
                'warning_threshold' => 2.50,
                'danger_threshold' => 5.00,
                'description' => 'Persentase bahan baku kain/aksesoris yang datang rusak/reject.',
            ],
            [
                'code' => 'SUPPLIER_LEAD_TIME',
                'name' => 'Supplier Delivery Lead Time',
                'category' => 'purchasing',
                'unit' => 'hari',
                'calculation_method' => 'avg(tgl_terima - tgl_order)',
                'target_value' => 4.00,
                'warning_threshold' => 7.00,
                'danger_threshold' => 10.00,
                'description' => 'Kecepatan supplier memenuhi order pembelian material.',
            ],
            [
                'code' => 'WORKER_PRODUCTIVITY',
                'name' => 'Worker Daily Productivity',
                'category' => 'worker',
                'unit' => 'pcs',
                'calculation_method' => 'total_worker_qty / worker_active_days',
                'target_value' => 45.00,
                'warning_threshold' => 35.00,
                'danger_threshold' => 25.00,
                'description' => 'Output rata-rata per pekerja jahit/potong per hari.',
            ],
        ];

        foreach ($definitions as $def) {
            KpiDefinition::firstOrCreate(
                ['code' => $def['code']],
                $def
            );
        }
    }
}
