<?php

namespace Database\Seeders;

use App\Models\Accounting\ChartOfAccount;
use Illuminate\Database\Seeder;

class ChartOfAccountSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            // Aset (1-xxxx)
            ['account_code' => '1-1110', 'account_name' => 'Kas Operasional (Petty Cash)', 'category' => 'asset', 'sub_category' => 'Kas & Bank', 'normal_balance' => 'debit'],
            ['account_code' => '1-1120', 'account_name' => 'Bank BCA Operasional', 'category' => 'asset', 'sub_category' => 'Kas & Bank', 'normal_balance' => 'debit'],
            ['account_code' => '1-1130', 'account_name' => 'Bank Mandiri Penerimaan', 'category' => 'asset', 'sub_category' => 'Kas & Bank', 'normal_balance' => 'debit'],
            ['account_code' => '1-1210', 'account_name' => 'Piutang Usaha Produksi', 'category' => 'asset', 'sub_category' => 'Piutang', 'normal_balance' => 'debit'],
            ['account_code' => '1-1220', 'account_name' => 'Piutang Usaha Sample', 'category' => 'asset', 'sub_category' => 'Piutang', 'normal_balance' => 'debit'],
            ['account_code' => '1-1310', 'account_name' => 'Persediaan Bahan Baku (Kain)', 'category' => 'asset', 'sub_category' => 'Persediaan', 'normal_balance' => 'debit'],
            ['account_code' => '1-1320', 'account_name' => 'Persediaan Aksesoris & Trims', 'category' => 'asset', 'sub_category' => 'Persediaan', 'normal_balance' => 'debit'],
            ['account_code' => '1-1330', 'account_name' => 'Barang Dalam Proses (WIP)', 'category' => 'asset', 'sub_category' => 'Persediaan', 'normal_balance' => 'debit'],
            ['account_code' => '1-1340', 'account_name' => 'Persediaan Barang Jadi', 'category' => 'asset', 'sub_category' => 'Persediaan', 'normal_balance' => 'debit'],
            ['account_code' => '1-1410', 'account_name' => 'Uang Muka Pembelian Supplier', 'category' => 'asset', 'sub_category' => 'Uang Muka', 'normal_balance' => 'debit'],
            ['account_code' => '1-2100', 'account_name' => 'Peralatan & Mesin Pabrik', 'category' => 'asset', 'sub_category' => 'Aset Tetap', 'normal_balance' => 'debit'],
            ['account_code' => '1-2190', 'account_name' => 'Akumulasi Penyusutan Mesin', 'category' => 'asset', 'sub_category' => 'Aset Tetap', 'normal_balance' => 'credit'],

            // Kewajiban (2-xxxx)
            ['account_code' => '2-1110', 'account_name' => 'Hutang Usaha Supplier Bahan', 'category' => 'liability', 'sub_category' => 'Hutang Usaha', 'normal_balance' => 'credit'],
            ['account_code' => '2-1120', 'account_name' => 'Hutang Usaha Supplier Aksesoris', 'category' => 'liability', 'sub_category' => 'Hutang Usaha', 'normal_balance' => 'credit'],
            ['account_code' => '2-1130', 'account_name' => 'Hutang Vendor Makloon (Sablon/Bordir)', 'category' => 'liability', 'sub_category' => 'Hutang Usaha', 'normal_balance' => 'credit'],
            ['account_code' => '2-1210', 'account_name' => 'Uang Muka Pesanan Produksi (DP Customer)', 'category' => 'liability', 'sub_category' => 'Uang Muka Penjualan', 'normal_balance' => 'credit'],
            ['account_code' => '2-1220', 'account_name' => 'Uang Muka Pesanan Sample', 'category' => 'liability', 'sub_category' => 'Uang Muka Penjualan', 'normal_balance' => 'credit'],
            ['account_code' => '2-1310', 'account_name' => 'Hutang Upah Borongan Worker', 'category' => 'liability', 'sub_category' => 'Hutang Biaya', 'normal_balance' => 'credit'],
            ['account_code' => '2-1320', 'account_name' => 'Hutang Gaji Staf', 'category' => 'liability', 'sub_category' => 'Hutang Biaya', 'normal_balance' => 'credit'],

            // Ekuitas (3-xxxx)
            ['account_code' => '3-1000', 'account_name' => 'Modal Disetor Pemilik', 'category' => 'equity', 'sub_category' => 'Modal', 'normal_balance' => 'credit'],
            ['account_code' => '3-2000', 'account_name' => 'Laba Ditahan (Retained Earnings)', 'category' => 'equity', 'sub_category' => 'Modal', 'normal_balance' => 'credit'],
            ['account_code' => '3-3000', 'account_name' => 'Laba/Rugi Periode Berjalan', 'category' => 'equity', 'sub_category' => 'Modal', 'normal_balance' => 'credit'],

            // Pendapatan (4-xxxx)
            ['account_code' => '4-1000', 'account_name' => 'Pendapatan Penjualan Produksi', 'category' => 'revenue', 'sub_category' => 'Pendapatan Usaha', 'normal_balance' => 'credit'],
            ['account_code' => '4-2000', 'account_name' => 'Pendapatan Penjualan Sample', 'category' => 'revenue', 'sub_category' => 'Pendapatan Usaha', 'normal_balance' => 'credit'],
            ['account_code' => '4-3000', 'account_name' => 'Pendapatan Jasa Pengiriman', 'category' => 'revenue', 'sub_category' => 'Pendapatan Lain', 'normal_balance' => 'credit'],
            ['account_code' => '4-9000', 'account_name' => 'Diskon & Retur Penjualan', 'category' => 'revenue', 'sub_category' => 'Pengurang Pendapatan', 'normal_balance' => 'debit'],

            // HPP / COGS (5-xxxx)
            ['account_code' => '5-1100', 'account_name' => 'Biaya Bahan Baku Kain Utama', 'category' => 'cogs', 'sub_category' => 'Bahan Baku', 'normal_balance' => 'debit'],
            ['account_code' => '5-1200', 'account_name' => 'Biaya Aksesoris & Trims', 'category' => 'cogs', 'sub_category' => 'Bahan Baku', 'normal_balance' => 'debit'],
            ['account_code' => '5-2100', 'account_name' => 'Upah Operator Potong (Cutting)', 'category' => 'cogs', 'sub_category' => 'Tenaga Kerja', 'normal_balance' => 'debit'],
            ['account_code' => '5-2200', 'account_name' => 'Upah Operator Jahit (Sewing)', 'category' => 'cogs', 'sub_category' => 'Tenaga Kerja', 'normal_balance' => 'debit'],
            ['account_code' => '5-2300', 'account_name' => 'Upah Finishing & Packing', 'category' => 'cogs', 'sub_category' => 'Tenaga Kerja', 'normal_balance' => 'debit'],
            ['account_code' => '5-3100', 'account_name' => 'Biaya Sablon & DTF (Makloon)', 'category' => 'cogs', 'sub_category' => 'Subkontrak', 'normal_balance' => 'debit'],
            ['account_code' => '5-3200', 'account_name' => 'Biaya Bordir Komputer (Makloon)', 'category' => 'cogs', 'sub_category' => 'Subkontrak', 'normal_balance' => 'debit'],
            ['account_code' => '5-3300', 'account_name' => 'Biaya Washing & Treatment', 'category' => 'cogs', 'sub_category' => 'Subkontrak', 'normal_balance' => 'debit'],
            ['account_code' => '5-4000', 'account_name' => 'Biaya Kerusakan & Scrap / Defect', 'category' => 'cogs', 'sub_category' => 'Waste', 'normal_balance' => 'debit'],
            ['account_code' => '5-5100', 'account_name' => 'Biaya Packaging & Polybag', 'category' => 'cogs', 'sub_category' => 'Overhead', 'normal_balance' => 'debit'],

            // Beban Operasional / OPEX (6-xxxx)
            ['account_code' => '6-1000', 'account_name' => 'Beban Gaji Karyawan Tetap', 'category' => 'expense', 'sub_category' => 'Beban Kantor', 'normal_balance' => 'debit'],
            ['account_code' => '6-2000', 'account_name' => 'Beban Sewa Pabrik & Kantor', 'category' => 'expense', 'sub_category' => 'Beban Kantor', 'normal_balance' => 'debit'],
            ['account_code' => '6-3000', 'account_name' => 'Beban Listrik & Utilitas Pabrik', 'category' => 'expense', 'sub_category' => 'Beban Utilitas', 'normal_balance' => 'debit'],
            ['account_code' => '6-4000', 'account_name' => 'Beban Pemasaran & Sales', 'category' => 'expense', 'sub_category' => 'Beban Operasional', 'normal_balance' => 'debit'],
            ['account_code' => '6-5000', 'account_name' => 'Beban Transportasi & BBM', 'category' => 'expense', 'sub_category' => 'Beban Operasional', 'normal_balance' => 'debit'],
            ['account_code' => '6-6000', 'account_name' => 'Beban Pemeliharaan Mesin', 'category' => 'expense', 'sub_category' => 'Beban Pemeliharaan', 'normal_balance' => 'debit'],
            ['account_code' => '6-7000', 'account_name' => 'Beban Perlengkapan & Konsumsi', 'category' => 'expense', 'sub_category' => 'Beban Operasional', 'normal_balance' => 'debit'],
        ];

        foreach ($accounts as $acc) {
            ChartOfAccount::firstOrCreate(
                ['account_code' => $acc['account_code']],
                $acc
            );
        }
    }
}
