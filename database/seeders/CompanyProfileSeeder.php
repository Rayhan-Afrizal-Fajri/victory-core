<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\CompanyProfile;

class CompanyProfileSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        CompanyProfile::create(
            [
                'company_name' => 'PT. Victorylabs Global Industry',
                'company_type' => 'non_pkp',
                'bank_type' => 'BCA (Bank Central Asia)',
                'account_number' => '453.12.06660',
                'account_name' => 'Victor Harlim MBA',
                'address' => 'kcp Lingkar Selatan, Bandung, West Java, Indonesia',
                'swift_code' => 'CENAIDJA'
            ]
        );
        CompanyProfile::create(
            [
                'company_name' => 'CV Victory Mitra Lestari',
                'company_type' => 'pkp',
                'bank_type' => 'BCA (Bank Central Asia)',
                'account_number' => '4533.055900',
                'tax_percentage' => 11,
                'account_name' => 'Victor Harlim MBA',
                'address' => 'kcp Lingkar Selatan, Bandung, West Java, Indonesia',
                'swift_code' => 'CENAIDJA'
            ],
        );
        CompanyProfile::create(
            [
                'company_name' => 'CV Victory Makmur Pradipa',
                'company_type' => 'pkp',
                'bank_type' => 'BPD (Bank Pembangunan Daerah)',
                'account_number' => '010.02.02.42332-3',
                'tax_percentage' => 11,
                'account_name' => 'CV. VICTORY MAKMUR PRADIPA',
                'address' => 'Bali Cabang Renon',
                'swift_code' => 'CENAIDJA'
            ],
        );
    }
}
