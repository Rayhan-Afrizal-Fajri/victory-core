<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithTitle;

class ProductTemplateExport implements FromArray, WithTitle
{
    public function title(): string
    {
        return 'Template Produk';
    }

    public function array(): array
    {
        return [
            ['', '', '', '', '', '', '', '', '', ''],
            ['', 'Contoh Produk T-Shirt Combed - DTF', 'Total Harga/Pcs', '', '', '', '', '', '', ''],
            ['', 'Bahan', '39951', '', '', '', '', '', '', ''],
            ['', 'Aksesoris', '5329', '', '', '', '', '', '', ''],
            ['', 'Pekerja', '7250', '', '', '', '', '', '', ''],
            ['', 'Total Biaya Per Pcs', '52530', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', ''],
            ['BAHAN UTAMA', '', '', '', '', '', '', '', '', ''],
            ['NO', 'BAHAN', 'WARNA', 'PEMAKAIAN', 'UNIT', 'KETERANGAN Pemakaian', 'VENDOR', 'HARGA ECER', 'HARGA ROLL', 'HARGA / PCS'],
            ['1', 'Cotton Combed Premium', 'Hitam', '0.29', 'Kg', '1 kg untuk 3,5 Pcs', 'CV. Terang Mulia Bandung', '135000', '', '38571'],
            ['2', 'Rib Cotton Combed Premium', 'Hitam', '0.01', 'Kg', '1 Kg untuk 100 Pcs', 'CV. Terang Mulia Bandung', '138000', '', '1380'],
            ['AKSESORIS', '', '', '', '', '', '', '', '', ''],
            ['NO', 'BAHAN', 'WARNA', 'PEMAKAIAN', 'UNIT', 'KET. PEMAKAIAN', 'VENDOR', 'HARGA ECER', 'HARGA ROLL', 'HARGA / PCS'],
            ['1', 'Benang Jahit', 'Hitam', '0.04', 'Lusin', '1 lusin jadi 100pc', 'Toko 1001', '25000', '', '1000'],
            ['2', 'Benang Obras', 'Hitam', '0.00', 'Cones', '4 cones jadi 120pc', 'Toko 1001', '13000', '', '0'],
            ['3', 'Label Size Bordir', 'Hitam', '0.01', 'Golong', '1 Golong Jadi 100 pc', 'Toko 1001', '10000', '', '100'],
            ['4', 'Plastik Opp 30 Micron', 'Bening', '1.00', 'Pcs', '1 Plastik 1 Pcs', 'Mapan Plastik', '370', '', '370'],
            ['5', 'Karung', 'Putih', '0.01', 'Pcs', '1 karung 100 pcs', 'Cibadak', '5000', '', '50'],
            ['6', 'DTF', 'Mix Warna', '1', 'Pcs', '-', 'Max Print', '3750', '', '3750'],
            ['Manufaktur', '', '', '', '', '', '', '', '', ''],
            ['NO', 'WORK', '', 'PEMAKAIAN', 'UNIT', 'KET. PEMAKAIAN', 'VENDOR', 'ESTIMASI MIN', '', 'HARGA / PCS'],
            ['1', 'Cutting T-Shirt', '', '1', 'Pcs', '', 'VML', '750', '', '750'],
            ['2', 'Sablon T-Shirt', '', '1', 'Pcs', '', 'VML', '2000', '', '2000'],
            ['3', 'Jahit T-Shirt', '', '1', 'Pcs', '', 'VML', '2500', '', '2500'],
            ['4', 'QC T-Shirt', '', '1', 'Pcs', '', 'VML', '2000', '', '2000'],
        ];
    }
}
