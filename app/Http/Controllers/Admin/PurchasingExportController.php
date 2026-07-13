<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use App\Exports\PurchasingExport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Carbon\Carbon;

class PurchasingExportController extends Controller
{
    /**
     * Handle the export process based on the requested type.
     */
    public function export(Request $request)
    {
        $request->validate([
            'type' => 'required|integer|in:1,2,3,4',
            // param dibutuhkan untuk type 1 (pesanan_id), type 2 (job_ticket), type 3 (sample/production)
            'param' => 'required_unless:type,4', 
        ]);

        $type = $request->type;
        $param = $request->param;

        // Generate nama file agar rapi
        $date = Carbon::now()->format('Ymd_His');
        $fileName = 'Purchasing_Export_';

        switch ($type) {
            case 1:
                $fileName .= 'Pesanan_' . $param . '_' . $date . '.xlsx';
                break;
            case 2:
                $fileName .= 'JobTicket_' . $param . '_' . $date . '.xlsx';
                break;
            case 3:
                $fileName .= 'Global_' . ucfirst($param) . '_' . $date . '.xlsx';
                break;
            case 4:
                $fileName .= 'Global_Gabungan_' . $date . '.xlsx';
                break;
        }

        return Excel::download(new PurchasingExport($type, $param), $fileName);
    }
}