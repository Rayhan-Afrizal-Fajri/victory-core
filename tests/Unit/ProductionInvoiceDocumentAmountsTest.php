<?php

namespace Tests\Unit;

use App\Support\ProductionInvoiceDocumentAmounts;
use PHPUnit\Framework\TestCase;

class ProductionInvoiceDocumentAmountsTest extends TestCase
{
    public function test_payment_of_half_the_invoice_completes_dp_and_leaves_the_settlement_due(): void
    {
        $amounts = ProductionInvoiceDocumentAmounts::calculate(50_000_000, 25_000_000);

        $this->assertSame(25_000_000.0, $amounts['dp_total']);
        $this->assertSame(25_000_000.0, $amounts['dp_paid']);
        $this->assertSame(0.0, $amounts['dp_remaining']);
        $this->assertSame(25_000_000.0, $amounts['settlement_total']);
        $this->assertSame(0.0, $amounts['settlement_paid']);
        $this->assertSame(25_000_000.0, $amounts['settlement_remaining']);
    }

    public function test_payment_above_dp_is_allocated_to_the_settlement(): void
    {
        $amounts = ProductionInvoiceDocumentAmounts::calculate(50_000_000, 30_000_000);

        $this->assertSame(25_000_000.0, $amounts['dp_paid']);
        $this->assertSame(5_000_000.0, $amounts['settlement_paid']);
        $this->assertSame(20_000_000.0, $amounts['settlement_remaining']);
    }

    public function test_odd_totals_split_without_losing_a_rupiah(): void
    {
        $amounts = ProductionInvoiceDocumentAmounts::calculate(101, 101);

        $this->assertSame(51.0, $amounts['dp_total']);
        $this->assertSame(50.0, $amounts['settlement_total']);
        $this->assertSame(101.0, $amounts['dp_total'] + $amounts['settlement_total']);
        $this->assertSame(101.0, $amounts['dp_paid'] + $amounts['settlement_paid']);
        $this->assertSame(0.0, $amounts['settlement_remaining']);
    }
}