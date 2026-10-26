<?php

namespace App\Http\Controllers\Admin\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReceivableController extends Controller
{
    public function index(Request $request): Response
    {
        $invoices = Invoice::with(['jobTicket.customer', 'payments'])
            ->orderByDesc('id')
            ->get()
            ->map(function ($inv) {
                $total = (float) $inv->total_tagihan;
                $verifiedPayments = $inv->payments->where('status', 'verified')->sum('jumlah_bayar');
                $remaining = max(0, $total - (float) $verifiedPayments);

                $dueDate = $inv->tgl_jatuh_tempo ? date('Y-m-d', strtotime($inv->tgl_jatuh_tempo)) : ($inv->created_at ? $inv->created_at->addDays(30)->format('Y-m-d') : now()->format('Y-m-d'));
                $daysOverdue = (int) round((time() - strtotime($dueDate)) / 86400);

                // Aging category
                $aging = 'current';
                if ($daysOverdue > 90) {
                    $aging = '>90_days';
                } elseif ($daysOverdue > 60) {
                    $aging = '61_90_days';
                } elseif ($daysOverdue > 30) {
                    $aging = '31_60_days';
                } elseif ($daysOverdue > 0) {
                    $aging = '1_30_days';
                }

                $job = $inv->jobTicket;
                $customer = $job ? $job->customer : null;
                $customerName = $job ? ($job->customer_nama_snapshot ?: ($customer ? ($customer->nama ?: $customer->name) : 'Pelanggan')) : 'Pelanggan';

                return [
                    'id' => $inv->id,
                    'invoiceNumber' => $inv->no_invoice,
                    'jobTicketNo' => $job ? $job->no_job_ticket : '-',
                    'customerName' => $customerName,
                    'category' => $inv->kategori_invoice,
                    'issueDate' => $inv->created_at ? $inv->created_at->format('Y-m-d') : '',
                    'dueDate' => $dueDate,
                    'daysOverdue' => max(0, $daysOverdue),
                    'totalAmount' => $total,
                    'paidAmount' => (float) $verifiedPayments,
                    'remainingAmount' => $remaining,
                    'status' => $remaining <= 0 ? 'paid' : ($verifiedPayments > 0 ? 'partially_paid' : 'unpaid'),
                    'aging' => $aging,
                ];
            });

        // Aggregations
        $totalAR = $invoices->sum('remainingAmount');
        $totalPaid = $invoices->sum('paidAmount');
        $currentAR = $invoices->where('aging', 'current')->sum('remainingAmount');
        $aging1_30 = $invoices->where('aging', '1_30_days')->sum('remainingAmount');
        $aging31_60 = $invoices->where('aging', '31_60_days')->sum('remainingAmount');
        $aging61_90 = $invoices->where('aging', '61_90_days')->sum('remainingAmount');
        $agingOver90 = $invoices->where('aging', '>90_days')->sum('remainingAmount');

        return Inertia::render('admin/accounting/receivables', [
            'receivables' => $invoices,
            'summary' => [
                'totalAR' => $totalAR,
                'totalPaid' => $totalPaid,
                'current' => $currentAR,
                'aging1_30' => $aging1_30,
                'aging31_60' => $aging31_60,
                'aging61_90' => $aging61_90,
                'agingOver90' => $agingOver90,
            ],
        ]);
    }
}
