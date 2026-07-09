<?php

namespace Tests\Feature;

use App\Models\Design;
use App\Models\JobTicket;
use App\Models\Pesanan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DesignExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_design_history_can_be_exported_to_pdf()
    {
        $user = User::factory()->create();

        $jobTicket = JobTicket::create([
            'no_job_ticket' => 'JT-001',
            'date' => now()->toDateString(),
            'status' => 'Design',
            'created_by' => $user->id,
        ]);

        $pesanan = Pesanan::create([
            'job_ticket_id' => $jobTicket->id,
            'produk' => 'Test Product',
            'requested_product_name' => 'Test Product',
            'q' => 10,
            'qs' => 10,
        ]);

        Design::create([
            'pesanan_id' => $pesanan->id,
            'designer_id' => $user->id,
            'file_path' => 'designs/test.png',
            'status' => 'waiting_approval',
            'uploaded_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($user)->get(route('designs.export-pdf', $pesanan));

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $response->assertDownload();
    }
}
