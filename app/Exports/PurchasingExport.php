<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class PurchasingExport implements WithMultipleSheets
{
    protected $type;
    protected $param;

    public function __construct($type, $param = null)
    {
        $this->type = $type;
        $this->param = $param;
    }

    public function sheets(): array
    {
        $sheets = [];

        // Nek milih tipe 3 (Mung njaluk mligi Sample utawa Produksi thok)
        if ($this->type == 3) {
            $sheets[] = new PurchasingSheetExport($this->type, $this->param, $this->param);
        } else {
            // Nek tipe liyane (Global, per Pesanan, per Job Ticket), gawe 2 Sheet langsung
            $sheets[] = new PurchasingSheetExport($this->type, $this->param, 'sample');
            $sheets[] = new PurchasingSheetExport($this->type, $this->param, 'production');
        }

        return $sheets;
    }
}