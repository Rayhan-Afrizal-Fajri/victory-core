<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ProductCategoryTemplateExport implements FromArray, WithHeadings
{
    public function array(): array
    {
        return [
            [
                'Test',
                'American Drill - Intan Textile, Bahan - Karuniatex',
                'Benang Jahit - Toko 1001, Boor - Karuniatex, Bordir - Karuniatex, Cat Sablon - Max Print, Dtf - Karuniatex, Kain Keras - Karuni',
                'Setting, Cutting, Jahit, QC, Packing, Sablon, Finishing'
            ],
            [
                'T-Shirt',
                'Kain Combed 24s, Kain Rib',
                'Benang Jahit - Toko 1001, Label Woven, Plastik OPP',
                'Setting, Cutting, Sablon, Jahit, QC, Finishing, Packing'
            ]
        ];
    }

    public function headings(): array
    {
        return [
            'Name',
            'Bahan',
            'Aksesoris',
            'Manufaktur',
        ];
    }
}
