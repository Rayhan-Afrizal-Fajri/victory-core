<?php

namespace Tests\Feature;

use App\Models\CompanyProfile;
use App\Models\Customer;
use App\Models\JobTicket;
use App\Models\Payment;
use App\Models\Pesanan;
use App\Models\ProductionRun;
use App\Models\Quotation;
use App\Models\User;
use App\Services\InvoiceService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ProductionZeroDpPaymentFlowTest extends TestCase
{
    private User $user;

    private CompanyProfile $companyProfile;

    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropAllTables();

        $mysqlOnlyMigrations = [
            '2026_09_26_075216_modify_quotations_table.php',
            '2026_10_03_000002_backfill_existing_quotation_snapshots.php',
            '2026_10_12_000001_update_job_ticket_id_cascade_on_quotations_table.php',
        ];

        $files = glob(database_path('migrations/*.php')) ?: [];
        sort($files);

        foreach ($files as $file) {
            $basename = basename($file);
            if (in_array($basename, $mysqlOnlyMigrations, true)) {
                if ($basename === '2026_09_26_075216_modify_quotations_table.php' && Schema::hasTable('quotations')) {
                    Schema::table('quotations', function (Blueprint $table) {
                        $table->unsignedBigInteger('job_ticket_id')->nullable()->change();
                    });
                }

                continue;
            }

            Artisan::call('migrate', ['--path' => 'database/migrations/' . $basename]);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (['quotation.generate', 'quotation.approve', 'invoices.pay'] as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $this->user = User::factory()->create(['is_active' => true]);
        $this->user->givePermissionTo(['quotation.generate', 'quotation.approve', 'invoices.pay']);

        $this->companyProfile = CompanyProfile::create([
            'company_name' => 'PT Victory Test',
            'company_type' => 'non_pkp',
            'bank_type' => 'BCA',
            'tax_percentage' => 0,
            'account_number' => '1234567890',
            'account_name' => 'PT Victory Test',
            'address' => 'Jakarta',
            'swift_code' => 'CENAIDJA',
        ]);

        $this->customer = Customer::create([
            'nama' => 'Budi',
            'nama_perusahaan' => 'PT Customer Test',
            'no_hp' => '08123456789',
            'alamat_detail' => 'Bandung',
        ]);
    }

    public function test_quotation_can_be_created_with_zero_dp_percentage(): void
    {
        $this->actingAs($this->user);

        $response = $this->post(route('quotations.store'), [
            'company_profile_id' => $this->companyProfile->id,
            'customer_id' => $this->customer->id,
            'dp_percentage' => 0,
            'items' => [
                [
                    'item_name' => 'Kaos Polos',
                    'quantity' => 100,
                    'price_per_pcs' => 50000,
                ],
            ],
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $quotation = Quotation::latest('id')->first();
        $this->assertNotNull($quotation);
        $this->assertSame(0.0, (float) $quotation->dp_percentage);
    }

    public function test_generate_quotation_accepts_zero_dp_percentage(): void
    {
        $this->actingAs($this->user);

        [$jobTicket] = $this->createJobTicketWithOrder(100, 50000);

        $response = $this->post(route('quotations.generate', $jobTicket), [
            'sample_qtys' => [$jobTicket->pesanans->first()->id => 0],
            'sample_prices' => [$jobTicket->pesanans->first()->id => 0],
            'notes' => ['Penawaran tanpa DP'],
            'dp_percentage' => 0,
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $quotation = Quotation::latest('id')->first();
        $this->assertNotNull($quotation);
        $this->assertSame(0.0, (float) $quotation->dp_percentage);
    }

    public function test_quotation_and_invoice_support_hundred_percent_dp_scheme(): void
    {
        $this->actingAs($this->user);

        [$jobTicket, $pesanan] = $this->createJobTicketWithOrder(100, 50000, 'JT-FULL-DP');

        $this->post(route('quotations.generate', $jobTicket), [
            'sample_qtys' => [$pesanan->id => 0],
            'sample_prices' => [$pesanan->id => 0],
            'notes' => ['Penawaran pembayaran penuh di muka 100%'],
            'dp_percentage' => 100,
        ])->assertRedirect()->assertSessionHasNoErrors();

        $quotation = Quotation::latest('id')->first();
        $this->assertNotNull($quotation);
        $this->assertSame(100.0, (float) $quotation->dp_percentage);

        $quotation->update(['status' => 'approved', 'approved_at' => now()]);

        $invoice = app(InvoiceService::class)->createProductionInvoice($jobTicket);
        $this->assertNotNull($invoice);
        $this->assertSame(100.0, (float) $invoice->dp_percentage);

        $workflow = $pesanan->workflowStatus()->first();
        $this->assertFalse((bool) $workflow->production_dp_paid);
        $this->assertFalse((bool) $workflow->final_payment_paid);

        $payment = Payment::create([
            'invoice_id' => $invoice->id,
            'tgl_bayar' => now()->toDateString(),
            'jumlah_bayar' => 5000000,
            'metode_pembayaran' => 'transfer',
            'status' => 'pending',
        ]);

        $this->patch(route('payments.verify', $payment->id))->assertRedirect();

        $workflow->refresh();
        $jobTicket->refresh();
        $invoice->refresh();

        $this->assertSame('paid', $invoice->status_tagihan);
        $this->assertTrue((bool) $workflow->production_dp_paid);
        $this->assertTrue((bool) $workflow->final_payment_paid);
        $this->assertNotSame('Done', $jobTicket->status);
    }

    public function test_invoice_service_creates_zero_dp_production_invoice_and_skips_dp_stage(): void
    {
        $this->actingAs($this->user);

        [$jobTicket, $pesanan] = $this->createJobTicketWithOrder(100, 50000);

        $jobTicket->quotations()->create([
            'company_profile_id' => $this->companyProfile->id,
            'customer_id' => $this->customer->id,
            'quotation_number' => 'QUO/2026/11/0001',
            'status' => 'approved',
            'quantity' => 100,
            'subtotal' => 5000000,
            'tax' => 0,
            'delivery_cost' => 0,
            'grand_total' => 5000000,
            'dp_percentage' => 0,
            'created_by' => $this->user->id,
        ]);

        $invoice = app(InvoiceService::class)->createProductionInvoice($jobTicket);

        $this->assertNotNull($invoice);
        $this->assertEquals(0.0, (float) $invoice->dp_percentage);
        $this->assertSame('unpaid', $invoice->status_tagihan);

        $workflow = $pesanan->workflowStatus()->first();
        $this->assertNotNull($workflow);
        $this->assertTrue((bool) $workflow->production_invoice_created);
        $this->assertTrue((bool) $workflow->production_dp_paid);
        $this->assertFalse((bool) $workflow->final_payment_paid);

        $this->assertDatabaseHas('workflow_histories', [
            'job_ticket_id' => $jobTicket->id,
            'step' => 'finance',
            'action' => 'production_dp_skipped',
        ]);

        $this->get(route('invoices.print', ['invoice' => $invoice->id, 'document' => 'dp']))
            ->assertStatus(422);
    }

    public function test_verifying_full_payment_upfront_does_not_mark_job_ticket_done_before_delivery(): void
    {
        $this->actingAs($this->user);

        foreach ([0.0, 50.0] as $index => $dpPercentage) {
            [$jobTicket, $pesanan] = $this->createJobTicketWithOrder(100, 50000, 'JT-FLOW-' . $index);

            $jobTicket->quotations()->create([
                'company_profile_id' => $this->companyProfile->id,
                'customer_id' => $this->customer->id,
                'quotation_number' => 'QUO/2026/11/100' . $index,
                'status' => 'approved',
                'quantity' => 100,
                'subtotal' => 5000000,
                'tax' => 0,
                'delivery_cost' => 0,
                'grand_total' => 5000000,
                'dp_percentage' => $dpPercentage,
                'created_by' => $this->user->id,
            ]);

            $invoice = app(InvoiceService::class)->createProductionInvoice($jobTicket);

            $payment = Payment::create([
                'invoice_id' => $invoice->id,
                'tgl_bayar' => now()->toDateString(),
                'jumlah_bayar' => 5000000,
                'metode_pembayaran' => 'transfer',
                'status' => 'pending',
            ]);

            $response = $this->patch(route('payments.verify', $payment->id));
            $response->assertRedirect();

            $invoice->refresh();
            $jobTicket->refresh();
            $workflow = $pesanan->workflowStatus()->first();

            $this->assertSame('paid', $invoice->status_tagihan);
            $this->assertTrue((bool) $workflow->production_dp_paid);
            $this->assertTrue((bool) $workflow->final_payment_paid);
            $this->assertFalse((bool) $workflow->delivered);
            $this->assertFalse((bool) $workflow->completed);
            $this->assertNotSame('Done', $jobTicket->status);

            if ($dpPercentage === 0.0) {
                $this->assertDatabaseMissing('workflow_histories', [
                    'job_ticket_id' => $jobTicket->id,
                    'action' => 'production_dp_verified',
                ]);
            }

            // Setelah barang benar-benar delivered, status JobTicket menjadi Done
            $run = ProductionRun::create([
                'pesanan_id' => $pesanan->id,
                'type' => 'production',
                'status' => 'in_delivery',
            ]);

            $this->patch(route('production-runs.mark-delivered', $run->id))
                ->assertRedirect();

            $workflow->refresh();
            $jobTicket->refresh();

            $this->assertTrue((bool) $workflow->delivered);
            $this->assertTrue((bool) $workflow->completed);
            $this->assertSame('Done', $jobTicket->status);
        }
    }

    public function test_decimal_pkp_total_with_hundred_percent_dp_marks_both_dp_and_final_paid(): void
    {
        $this->actingAs($this->user);

        [$jobTicket, $pesanan] = $this->createJobTicketWithOrder(1, 10050, 'JT-PKP-100');

        $jobTicket->quotations()->create([
            'company_profile_id' => $this->companyProfile->id,
            'customer_id' => $this->customer->id,
            'quotation_number' => 'QUO/2026/11/9001',
            'status' => 'approved',
            'quantity' => 1,
            'subtotal' => 10050,
            'tax' => 1105.50,
            'delivery_cost' => 0,
            'grand_total' => 11155.50,
            'dp_percentage' => 100,
            'created_by' => $this->user->id,
        ]);

        $invoice = app(InvoiceService::class)->createProductionInvoice($jobTicket);
        $this->assertNotNull($invoice);

        $payment = Payment::create([
            'invoice_id' => $invoice->id,
            'tgl_bayar' => now()->toDateString(),
            'jumlah_bayar' => 11155.50,
            'metode_pembayaran' => 'transfer',
            'status' => 'pending',
        ]);

        $this->patch(route('payments.verify', $payment->id))->assertRedirect();

        $invoice->refresh();
        $workflow = $pesanan->workflowStatus()->first();

        $this->assertSame('paid', $invoice->status_tagihan);
        $this->assertTrue((bool) $workflow->production_dp_paid);
        $this->assertTrue((bool) $workflow->final_payment_paid);

        $this->get(route('invoices.print', ['invoice' => $invoice->id, 'document' => 'settlement']))
            ->assertStatus(422);
        $this->get(route('invoices.export-word', ['invoice' => $invoice->id, 'document' => 'settlement']))
            ->assertStatus(422);
    }

    public function test_cancelling_zero_dp_production_invoice_resets_workflow_dp_flags(): void
    {
        $this->actingAs($this->user);

        [$jobTicket, $pesanan] = $this->createJobTicketWithOrder(100, 50000, 'JT-CANCEL-0');

        $jobTicket->quotations()->create([
            'company_profile_id' => $this->companyProfile->id,
            'customer_id' => $this->customer->id,
            'quotation_number' => 'QUO/2026/11/9002',
            'status' => 'approved',
            'quantity' => 100,
            'subtotal' => 5000000,
            'tax' => 0,
            'delivery_cost' => 0,
            'grand_total' => 5000000,
            'dp_percentage' => 0,
            'created_by' => $this->user->id,
        ]);

        $invoice = app(InvoiceService::class)->createProductionInvoice($jobTicket);
        $this->assertNotNull($invoice);

        $this->get(route('invoices.export-word', ['invoice' => $invoice->id, 'document' => 'dp']))
            ->assertStatus(422);

        $this->patch(route('invoices.cancel', $invoice->id))->assertRedirect();

        $invoice->refresh();
        $workflow = $pesanan->workflowStatus()->first();

        $this->assertSame('cancelled', $invoice->status_tagihan);
        $this->assertFalse((bool) $workflow->production_invoice_created);
        $this->assertFalse((bool) $workflow->production_dp_paid);
        $this->assertFalse((bool) $workflow->final_payment_paid);
    }

    /**
     * @return array{0: JobTicket, 1: Pesanan}
     */
    private function createJobTicketWithOrder(int $qty, float $pricePerPcs, string $ticketNo = 'JT-ZERO-001'): array
    {
        $jobTicket = JobTicket::create([
            'no_job_ticket' => $ticketNo,
            'date' => now()->toDateString(),
            'deadline' => now()->addDays(14)->toDateString(),
            'customer_id' => $this->customer->id,
            'company_profile_id' => $this->companyProfile->id,
            'status' => 'Quotation',
            'created_by' => $this->user->id,
        ]);

        $pesanan = Pesanan::create([
            'job_ticket_id' => $jobTicket->id,
            'produk' => 'Kaos Polos',
            'requested_product_name' => 'Kaos Polos',
            'q' => $qty,
            'qs' => 0,
            'harga_jual_per_pcs' => $pricePerPcs,
        ]);

        $pesanan->workflowStatus()->create([
            'design_specs_completed' => true,
            'price_approved' => true,
        ]);

        return [$jobTicket->load('pesanans.workflowStatus'), $pesanan];
    }
}
