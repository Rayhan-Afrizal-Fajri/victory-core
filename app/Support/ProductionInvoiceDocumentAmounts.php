<?php

namespace App\Support;

class ProductionInvoiceDocumentAmounts
{
    public static function calculate(float $total, float $verifiedPaid): array
    {
        $total = max($total, 0);
        $verifiedPaid = min(max($verifiedPaid, 0), $total);
        $dpTotal = round($total / 2, 0, PHP_ROUND_HALF_UP);
        $settlementTotal = $total - $dpTotal;
        $dpPaid = min($verifiedPaid, $dpTotal);
        $settlementPaid = min(max($verifiedPaid - $dpTotal, 0), $settlementTotal);

        return [
            'production_total' => $total,
            'dp_total' => $dpTotal,
            'dp_paid' => $dpPaid,
            'dp_remaining' => $dpTotal - $dpPaid,
            'settlement_total' => $settlementTotal,
            'settlement_paid' => $settlementPaid,
            'settlement_remaining' => $settlementTotal - $settlementPaid,
        ];
    }
}