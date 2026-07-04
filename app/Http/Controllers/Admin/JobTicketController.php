<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Models\JobTicket;
// use App\Models\Pesanan;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\CompanyProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JobTicketController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();
        $isAdmin = $user->can('dashboard.admin');

        $jobTicketsQuery = JobTicket::query()
            ->with([
                'customer',
                'pesanans.workflowStatus',
            ])
            ->latest();

        if (!$isAdmin) {
            $jobTicketsQuery->where('customer_id', $user->customer?->id);
        }

        $jobTickets = $jobTicketsQuery->get()->map(function ($ticket) {
            $pesanans = $ticket->pesanans;
            
            // Hitung agregasi progress dari semua pesanan di dalam job ticket
            $totalProgress = 0;
            $allSampleAcc = true;
            $hasStartedProduction = false;
            
            $produkNames = [];

            foreach ($pesanans as $pesanan) {
                $workflow = $pesanan->workflowStatus;
                $progressData = $this->calculateWorkflowProgress($workflow);
                
                $totalProgress += $progressData['percent'];
                
                if (!($workflow?->sample_approved)) {
                    $allSampleAcc = false;
                }
                
                if ($workflow?->design_approved) {
                    $hasStartedProduction = true;
                }

                $produkNames[] = $pesanan->requested_product_name ?: $pesanan->produk;
            }

            $avgProgress = $pesanans->count() > 0 ? round($totalProgress / $pesanans->count()) : 0;
            $canModify = !$hasStartedProduction;

            return [
                'id' => $ticket->id,
                'no_job_ticket' => $ticket->no_job_ticket,
                'produk' => !empty($produkNames) ? implode(', ', array_unique($produkNames)) : '-',
                'customer' => $ticket->customer?->nama_perusahaan
                    ?? $ticket->customer?->nama
                    ?? $ticket->customer_perusahaan_snapshot
                    ?? '-',
                'qty' => (int) $pesanans->sum('q'),
                'deadline' => $ticket->deadline,
                'status_divisi' => $ticket->status ?? 'Order Entry',
                'acc_sample' => $pesanans->count() > 0 ? $allSampleAcc : false,
                'sales_name' => $ticket->sales_name ?? '-',
                'progress' => $avgProgress,
                'current_step' => $ticket->status ?? 'Menunggu Proses',
                'can_edit' => $canModify,
                'can_delete' => $canModify,
            ];
        });

        return Inertia::render('admin/job-tickets/Index', [
            'orders' => $jobTickets,
        ]);
    }

    private function calculateWorkflowProgress($workflow): array
    {
        $steps = [
            ['label' => 'Order Entry', 'weight' => 5, 'done' => fn ($w) => (bool) ($w?->order_entry ?? $w?->pesanan_id ?? false)],
            ['label' => 'Design', 'weight' => 10, 'done' => fn ($w) => (bool) ($w?->design_approved ?? false)],
            ['label' => 'Quotation', 'weight' => 10, 'done' => fn ($w) => (bool) ($w?->quotation_approved ?? false)],
            ['label' => 'Sample Payment', 'weight' => 7, 'done' => fn ($w) => (bool) ($w?->sample_paid ?? false)],
            ['label' => 'Purchasing', 'weight' => 10, 'done' => fn ($w) => (bool) ($w?->materials_purchased ?? false)],
            ['label' => 'Materials Received', 'weight' => 10, 'done' => fn ($w) => (bool) ($w?->materials_received ?? false)],
            ['label' => 'Sample Created', 'weight' => 8, 'done' => fn ($w) => (bool) ($w?->sample_created ?? false)],
            ['label' => 'Sample Delivered', 'weight' => 5, 'done' => fn ($w) => (bool) ($w?->sample_delivered ?? false)],
            ['label' => 'Sample Approved', 'weight' => 5, 'done' => fn ($w) => (bool) ($w?->sample_approved ?? false)],
            ['label' => 'Production Payment', 'weight' => 7, 'done' => fn ($w) => (bool) ($w?->production_dp_paid ?? false)],
            ['label' => 'Production Started', 'weight' => 5, 'done' => fn ($w) => (bool) ($w?->production_started ?? false)],
            ['label' => 'Production Completed', 'weight' => 8, 'done' => fn ($w) => (bool) ($w?->production_completed ?? false)],
            ['label' => 'QC Completed', 'weight' => 5, 'done' => fn ($w) => (bool) ($w?->qc_completed ?? false)],
            ['label' => 'Packing', 'weight' => 5, 'done' => fn ($w) => (bool) ($w?->packing_completed ?? false)],
            ['label' => 'Final Payment', 'weight' => 5, 'done' => fn ($w) => (bool) ($w?->final_payment_paid ?? false)],
            ['label' => 'Delivered', 'weight' => 3, 'done' => fn ($w) => (bool) ($w?->delivered ?? false)],
            ['label' => 'Done', 'weight' => 2, 'done' => fn ($w) => (bool) ($w?->completed ?? false)],
        ];

        if (! $workflow) return ['percent' => 0, 'current_label' => 'Not Started'];

        $totalWeight = collect($steps)->sum('weight');
        $completedWeight = collect($steps)->sum(fn($step) => $step['done']($workflow) ? $step['weight'] : 0);

        $percent = min(100, round(($completedWeight / $totalWeight) * 100));
        $currentStep = collect($steps)->first(fn($step) => ! $step['done']($workflow));

        return [
            'percent' => $percent,
            'current_label' => $percent >= 100 ? 'Done' : ($currentStep['label'] ?? 'Done'),
        ];
    }

    /**
     * Display the specified resource.
     */
    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {        
        // Eager load disesuaikan: Invoices dan Quotations kini milik JobTicket
        $jobTicket = JobTicket::with([
            'customer',
            'invoices.payments', // Pindah ke JobTicket
            'quotations.items',  // Pindah ke JobTicket
            'productionRuns.processes.qcCheckedBy',
            'productionRuns.processes.pesanan',
            
            // Relasi yang tetap di Pesanan
            'pesanans.designs' => fn($q) => $q->latest(),
            'pesanans.orderSpecification',
            'pesanans.samples' => fn($q) => $q->with(['invoice.payments', 'media', 'delivery'])->latest(),
            'pesanans.purchasing' => fn($q) => $q->with('supplier', 'materialReceiving.checkedBy')->latest(),
            // 'pesanans.productionRuns.processes.qcCheckedBy', // Tambahkan eager load user QC
            'pesanans.productionProgress',
            'workflowHistory' => fn($q) => $q->with('user')->latest(),
            'pesanans.attachment',
            'pesanans.workflowStatus',
            'pesanans.sizeBreakdowns',
            'pesanans.manufacturingSpecs.vendor',
            'pesanans.materialSpecs.supplier',
            'pesanans.product',
        ])->findOrFail($id);

        $mapRun = function ($run) {
            if (! $run) return null;
            return [
                'id' => $run->id,
                'type' => $run->type,
                'quantity' => $run->quantity,
                'status' => $run->status,
                'packing_completed' => $run->packing_completed,
                'packing_notes' => $run->packing_notes,
                'customer_review_note' => $run->customer_review_note,
                'courier_name' => $run->courier_name,
                'tracking_number' => $run->tracking_number,
                'tracking_url' => $run->tracking_url,
                'delivery_note' => $run->delivery_note,
                'delivered_at' => $run->delivered_at,
                'approved_at' => $run->approved_at,
                'processes' => $run->processes->sortBy('sequence')->values()->map(fn ($process) => [
                    'id' => $process->id,
                    'pesanan_id' => $process->pesanan_id,
                    'work_name' => $process->work_name,
                    'sequence' => $process->sequence,
                    'status' => $process->status,
                    'quantity' => $process->quantity,
                    'started_at' => $process->started_at?->format('Y-m-d H:i:s'),
                    'completed_at' => $process->completed_at?->format('Y-m-d H:i:s'),
                    'qc_checked_at' => $process->qc_checked_at?->format('Y-m-d H:i:s'),
                    'qc_checked_by' => $process->qcCheckedBy?->name,
                    'qc_status' => $process->qc_status,
                    'checked_qty' => $process->checked_qty,
                    'passed_qty' => $process->passed_qty,
                    'defect_qty' => $process->defect_qty,
                    'qc_notes' => $process->qc_notes,
                ])->toArray(),
            ];
        };

        $sampleRun = $jobTicket->productionRuns?->where('type', 'sample')->sortByDesc('id')->first();
        $productionRun = $jobTicket->productionRuns?->where('type', 'production')->sortByDesc('id')->first();

        // Memetakan struktur Data Job Ticket
        $mapped = [
            'id' => $jobTicket->id,
            'no_job_ticket' => $jobTicket->no_job_ticket,
            'customer' => [
                'name' => $jobTicket->customer?->nama ?? $jobTicket->customer_nama_snapshot,
                'company' => $jobTicket->customer?->nama_perusahaan ?? $jobTicket->customer_perusahaan_snapshot,
                'email' => $jobTicket->customer?->user->email,
                'phone' => $jobTicket->customer?->no_hp,
            ],
            'company_profile' => [
                'company_name' => $jobTicket->companyProfile?->company_name,
                'company_type' => str_replace('_', ' ' , $jobTicket->companyProfile?->company_type),
                'bank_type' => $jobTicket->companyProfile?->bank_type,
                'account_number' => $jobTicket->companyProfile?->account_number,
                'tax_percentage' => $jobTicket->companyProfile?->tax_percentage,
                'address' => $jobTicket->companyProfile?->address,
            ],

            'sales_name' => $jobTicket->sales_name,
            'deadline' => $jobTicket->deadline,
            'customer_notes' => $jobTicket->customer_notes,
            'status' => $jobTicket->status,
            'created_at' => $jobTicket->created_at,

            // INVOICES - Kini levelnya global di Job Ticket
            'invoices' => $jobTicket->invoices->map(fn ($inv) => [
                'id' => $inv->id,
                'title' => $inv->no_invoice ?? $inv->kategori_invoice,
                'amount' => (float) $inv->total_tagihan,
                'status' => $inv->status_tagihan ?? 'unpaid',
                'due_date' => $inv->tgl_jatuh_tempo,
                'payments' => $inv->payments->toArray(),
            ])->toArray(),

            // QUOTATIONS - Kini levelnya global di Job Ticket
            'quotations' => $jobTicket->quotations->sortByDesc('id')->values()->map(fn ($q) => [
                'id' => $q->id,
                'quotation_number' => $q->quotation_number,
                'status' => $q->status,
                'grand_total' => (float) $q->grand_total,
                'valid_until' => $q->valid_until,
                'sample_qty' => $q->sample_qty,
                'items' => $q->items->map(fn ($item) => [
                    'id' => $item->id,
                    'pesanan_id' => $item->pesanan_id, // Link untuk tahu ini produk yang mana
                    'item_name' => $item->item_name,
                    'quantity' => $item->quantity,
                    'price_per_pcs' => (float) $item->price_per_pcs,
                    'subtotal' => (float) $item->subtotal,
                ])->toArray(),
            ])->toArray(),

            'sample_run' => $mapRun($sampleRun),
            'production_run' => $mapRun($productionRun),

            'workflow_histories' => $jobTicket->workflowHistory->map(fn ($h) => [
                'id' => $h->id,
                'actor' => $h->user?->name ?? 'System',
                'action' => $h->action,
                'note' => $h->notes,
                'created_at' => optional($h->created_at)->format('Y-m-d H:i:s'),
            ])->toArray(),

            'defect_histories' => $jobTicket->defectHistories->map(fn ($d) => [
                'id' => $d->id,
                
            ]),
            
            // ORDERS (Pesanans)
            'orders' => $jobTicket->pesanans->map(function($pesanan) {

                return [
                    'id' => $pesanan->id,
                    'product_name' => $pesanan->produk,
                    'requested_product_name' => $pesanan->requested_product_name,
                    'quantity' => $pesanan->q,
                    'sample_qty' => $pesanan->sample_qty,
                    'price_per_piece' => (float) $pesanan->harga_jual_per_pcs,
                    'estimated_hpp_per_piece' => (float) $pesanan->estimasi_hpp_per_pcs,
                    'status' => $pesanan->status_divisi,
                    
                    'product' => $pesanan->product ? [
                        'id' => $pesanan->product->id,
                        'name' => $pesanan->product->name,
                        'category' => $pesanan->product->category,
                    ] : null,

                    'size_breakdowns' => $pesanan->sizeBreakdowns->map(fn ($row) => [
                        'id' => $row->id,
                        'color' => $row->color,
                        'size_label' => $row->size_label,
                        'fabric_spec' => $row->fabric_spec,
                        'qty' => $row->qty,
                    ])->toArray(),

                    'workflow_status' => $pesanan->workflowStatus?->toArray() ?? [],

                    'productionProgress' => $pesanan->productionProgress?->toArray() ?? null,

                    'specs' => $pesanan->orderSpecification?->map(fn ($s) => [
                        'id' => $s->id,
                        'jenis_spesifikasi' => $s->jenis_spesifikasi,
                        'value' => $s->value,
                    ])->toArray(),

                    'designs' => $pesanan->designs->map(fn ($d) => [
                        'id' => $d->id,
                        'file_path' => $d->file_path,
                        'note' => $d->revision_note,
                        'status' => $d->status,
                        'approved' => (bool) $d->approved_at,
                        'created_at' => $d->uploaded_at,
                    ])->toArray(),

                    'samples' => $pesanan->samples->map(fn ($s) => [
                        'id' => $s->id,
                        'qty' => $s->qty,
                        'status' => $s->status,
                        'approved_at' => $s->approved_at,
                        'invoice' => $s->invoice,
                    ])->toArray(),

                    'purchasings' => $pesanan->purchasing->map(fn ($p) => [
                        'id' => $p->id,
                        'pesanan_material_spec_id' => $p->pesanan_material_spec_id,
                        'supplier' => $p->supplier ? ['nama' => $p->supplier->nama_perusahaan] : null,
                        'item' => $p->item_bahan,
                        'status' => $p->status,
                        'qty_bahan' => $p->qty_bahan,
                        'required_qty' => $p->required_qty,
                        'purchase_qty' => $p->purchase_qty,
                        'stock_qty' => $p->stock_qty,
                        'leftover_qty' => $p->leftover_qty,
                        'unit' => $p->satuan,
                        'harga_satuan' => $p->harga_satuan,
                        'total_harga' => $p->total_harga,
                        'purchase_scope' => $p->purchase_scope,
                        'remaining_qty' => $p->remaining_qty,
                        'receiving_status' => $p->receiving_status,
                        'material_receivings' => $p->materialReceiving->toArray(),
                    ])->toArray(),

                    'material_specs' => $pesanan->materialSpecs->map(fn ($spec) => [
                        'id' => $spec->id,
                        'type' => $spec->type,
                        'material_name' => $spec->material_name_snapshot,
                        'material_name_snapshot' => $spec->material_name_snapshot,
                        'color' => $spec->color,
                        'usage' => $spec->usage,
                        'unit' => $spec->unit,
                        'supplier' => $spec->supplier?->nama_perusahaan,
                        'supplier_id' => $spec->supplier?->id,
                        'harga_ecer' => $spec->harga_ecer,
                        'harga_roll' => $spec->harga_roll,
                        'price_type' => $spec->price_type,
                        'cost_per_pcs' => $spec->cost_per_pcs,
                    ])->toArray(),

                    'manufacturing_specs' => $pesanan->manufacturingSpecs->map(fn ($spec) => [
                        'id' => $spec->id,
                        'work_name' => $spec->work_name_snapshot,
                        'work_name_snapshot' => $spec->work_name_snapshot,
                        'usage' => $spec->usage,
                        'unit' => $spec->unit,
                        'usage_note' => $spec->usage_note,
                        'min_estimate' => $spec->min_estimate,
                        'max_estimate' => $spec->max_estimate,
                        'vendor' => $spec->vendor?->nama_perusahaan,
                        'vendor_id' => $spec->vendor?->id,
                        'cost_per_pcs' => $spec->cost_per_pcs,
                    ])->toArray(),

                    'attachments' => $pesanan->attachment->toArray(),
                ];
            })->toArray(),
        ];

        $productOption = Product::where('is_active', true)->where('is_pattern_available', true)->get()->map(fn ($p) => [
            'id' => $p->id,
            'name' => $p->name,
            'category' => $p->category,
        ]);

        $productOptionFromPesanan = [];

        $suppliers = Supplier::all();

        return Inertia::render('admin/job-tickets/Show', [
            'jobTicket' => $mapped,
            'suppliers' => $suppliers,
            'productOptions' => $productOption,
            'companyProfile' => CompanyProfile::all()
        ]);
    }

    /**
     * Update status divisi tingkat Global Job Ticket
     */
    public function updateStatus(Request $request, string $id)
    {
        $request->validate([
            'status_divisi' => [
                'required',
                'in:Penawaran,Quote,Sample,Blanks,CSA,Finance,Produksi,Pelunasan,Done,Cancel'
            ]
        ]);

        $jobTicket = JobTicket::findOrFail($id);

        $jobTicket->update([
            'status' => $request->status_divisi,
        ]);

        return back()->with('success', 'Status Job Ticket berhasil diperbarui.');
    }

    public function edit(string $id)
    {
        return redirect()->route('order-entry.edit', $id);
    }

    public function update(Request $request, string $id)
    {
        // Logika update ditangani oleh OrderEntryController
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(JobTicket $jobTicket)
    {
        // Pastikan relasi model di setting cascadeOnDelete pada DB / Eloquent
        $jobTicket->delete();
        
        return back()->with('success', 'Job Ticket beserta pesanannya berhasil dihapus.');
    }
}