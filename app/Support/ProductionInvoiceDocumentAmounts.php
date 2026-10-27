<?php

namespace App\Support;

class ProductionInvoiceDocumentAmounts
{
    public static function calculate(float $total, float $verifiedPaid, float $dpPercentage = 50.0): array
    {
        $total = max($total, 0);
        $verifiedPaid = min(max($verifiedPaid, 0), $total);
        $dpPercentage = max(min($dpPercentage, 100), 0);
        $dpTotal = round($total * ($dpPercentage / 100), 0, PHP_ROUND_HALF_UP);
        $settlementTotal = $total - $dpTotal;
        $dpPaid = min($verifiedPaid, $dpTotal);
        $settlementPaid = min(max($verifiedPaid - $dpTotal, 0), $settlementTotal);

        return [
            'production_total' => $total,
            'dp_percentage' => $dpPercentage,
            'settlement_percentage' => 100 - $dpPercentage,
            'dp_total' => $dpTotal,
            'dp_paid' => $dpPaid,
            'dp_remaining' => $dpTotal - $dpPaid,
            'settlement_total' => $settlementTotal,
            'settlement_paid' => $settlementPaid,
            'settlement_remaining' => $settlementTotal - $settlementPaid,
            'full_total' => $total,
            'full_paid' => $verifiedPaid,
            'full_remaining' => max($total - $verifiedPaid, 0),
        ];
    }
}