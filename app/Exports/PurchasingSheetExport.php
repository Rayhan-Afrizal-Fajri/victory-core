<?php

namespace App\Exports;

use App\Models\Purchasing;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Table;
use PhpOffice\PhpSpreadsheet\Worksheet\Table\TableStyle;

class PurchasingSheetExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithEvents, WithTitle
{
    protected $type;
    protected $param;
    protected $sheetType;

    public function __construct($type, $param, $sheetType)
    {
        $this->type = $type;
        $this->param = $param;
        $this->sheetType = $sheetType;
    }

    public function collection()
    {
        $query = Purchasing::with(['pesanan.jobTicket', 'supplier']);

        switch ($this->type) {
            case 1:
                $query->where('pesanan_id', $this->param);
                break;
            case 2:
                $query->whereHas('pesanan.jobTicket', function ($q) {
                    $q->where('no_job_ticket', $this->param);
                });
                break;
        }

        if ($this->sheetType === 'sample') {
            $query->whereIn('purchase_scope', ['sample', 'sample_revision', 'sample_and_production']);
        } else {
            $query->whereIn('purchase_scope', ['production', 'sample_and_production']);
        }

        return $query->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Job Ticket',
            'Item Bahan',
            'Supplier',
            'Status',
            'Kebutuhan (Required)',
            'Diterima (Received)',
            'Sisa Kebutuhan',
            'Total Kebutuhan (Sample + Produksi)',
        ];
    }

    public function map($p): array
    {
        $pesanan = $p->pesanan;
        $sampleQty = $pesanan ? (float) $pesanan->sample_qty : 0;
        $productionQty = $pesanan ? (float) $pesanan->q : 0;
        $totalQty = $sampleQty + $productionQty;

        $requiredQty = 0;
        $receivedQty = 0;

        if ($this->sheetType === 'sample') {
            if ($p->purchase_scope === 'sample' || $p->purchase_scope === 'sample_revision') {
                $requiredQty = (float) $p->required_qty;
            } elseif ($p->purchase_scope === 'sample_and_production' && $totalQty > 0) {
                $requiredQty = round(((float)$p->required_qty) * ($sampleQty / $totalQty), 4);
            }
            $receivedQty = min((float)$p->received_qty, $requiredQty);
            
        } else {
            if ($p->purchase_scope === 'production') {
                $requiredQty = (float) $p->required_qty;
            } elseif ($p->purchase_scope === 'sample_and_production' && $totalQty > 0) {
                $requiredQty = round(((float)$p->required_qty) * ($productionQty / $totalQty), 4);
            }
            
            $sampleReq = 0;
            if ($p->purchase_scope === 'sample_and_production' && $totalQty > 0) {
                $sampleReq = round(((float)$p->required_qty) * ($sampleQty / $totalQty), 4);
            }
            $receivedQty = min(max((float)$p->received_qty - $sampleReq, 0), $requiredQty);
        }

        $sisaKebutuhan = max($requiredQty - $receivedQty, 0);
        
        // Penambahan (float) di sini untuk menghilangkan 0 berlebih (misal 51.0000 jadi 51)
        $purchasedQty = (float) ($p->purchase_qty ?? 0);
        
        // Memastikan variabel lain juga menjadi float murni (agar konsisten)
        $requiredQty = (float) $requiredQty;
        $receivedQty = (float) $receivedQty;
        $sisaKebutuhan = (float) $sisaKebutuhan;

        $satuan = ' ' . $p->satuan;

        return [
            $p->id,
            $pesanan ? $pesanan->jobTicket->no_job_ticket : '-',
            $p->item_bahan,
            $p->supplier ? $p->supplier->nama_perusahaan : '-',
            $p->status,
            $requiredQty . $satuan,
            $receivedQty . $satuan,
            $sisaKebutuhan . $satuan,
            $purchasedQty . $satuan,
        ];
    }

    public function title(): string
    {
        return $this->sheetType === 'sample' ? 'Kebutuhan Sample' : 'Kebutuhan Produksi';
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                
                // Mengambil batas range data dinamis (Berapa kolom dan berapa baris)
                $highestRow = $sheet->getHighestDataRow();
                $highestColumn = $sheet->getHighestDataColumn();
                
                // Range dimulai dari A1 sampai ujung data (contoh: A1:I10)
                $range = 'A1:' . $highestColumn . $highestRow;

                // Membuat Objek Table
                $table = new Table();
                $table->setRange($range);
                
                // Nama table harus unik di setiap sheet excel
                $tableName = 'TabelData' . ucfirst($this->sheetType);
                $table->setName($tableName);

                // Mengatur Style Table (Style Medium 4 adalah warna Hijau khas Excel)
                $tableStyle = new TableStyle();
                $tableStyle->setTheme(TableStyle::TABLE_STYLE_MEDIUM4);
                $tableStyle->setShowRowStripes(true);
                
                $table->setStyle($tableStyle);
                $sheet->addTable($table);
            },
        ];
    }
}