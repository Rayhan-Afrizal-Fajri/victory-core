<?php

namespace App\Services;

use App\Models\CompanyProfile;
use App\Models\Customer;
use App\Models\JobTicket;
use App\Models\Quotation;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuotationDraftService
{
    public function save(array $data, ?Quotation $quotation = null): Quotation
    {
        return DB::transaction(function () use ($data, $quotation) {
            $wasAlreadyLinked = (bool) $quotation?->job_ticket_id;
            $jobTicket = !empty($data['job_ticket_id'])
                ? JobTicket::with('customer', 'companyProfile', 'pesanans')->findOrFail($data['job_ticket_id'])
                : $quotation?->jobTicket;

            if ($quotation?->job_ticket_id && $jobTicket?->id !== $quotation->job_ticket_id) {
                abort(422, 'Quotation yang sudah terhubung ke PO tidak dapat dipindahkan ke PO lain.');
            }

            $customer = $jobTicket?->customer
                ?? (!empty($data['customer_id']) ? Customer::findOrFail($data['customer_id']) : $quotation?->customer);
            $companyProfile = !empty($data['company_profile_id'])
                ? CompanyProfile::findOrFail($data['company_profile_id'])
                : $jobTicket?->companyProfile;

            if (!$companyProfile) {
                throw ValidationException::withMessages([
                    'company_profile_id' => 'Pilih profil perusahaan penerbit quotation.',
                ]);
            }

            $customerName = $jobTicket?->customer_nama_snapshot ?: $customer?->nama ?: ($data['customer_name'] ?? null);
            if (!$customerName) {
                throw ValidationException::withMessages([
                    'customer_name' => 'Pilih customer atau isi nama customer secara manual.',
                ]);
            }

            if ($jobTicket) {
                $orderIds = $jobTicket->pesanans->pluck('id')->map(fn ($id) => (int) $id)->all();
                foreach ($data['items'] as $index => $item) {
                    if (empty($item['pesanan_id']) || !in_array((int) $item['pesanan_id'], $orderIds, true)) {
                        throw ValidationException::withMessages([
                            "items.{$index}.pesanan_id" => 'Setiap item quotation yang memakai PO harus dipetakan ke pesanan pada PO tersebut.',
                        ]);
                    }
                }
            }

            $quantity = 0;
            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $quantity += (int) $item['quantity'];
                $subtotal += (int) $item['quantity'] * (float) $item['price_per_pcs'];
            }

            $tax = $companyProfile->company_type === 'pkp'
                ? round($subtotal * ((float) ($companyProfile->tax_percentage ?? 0) / 100), 2)
                : 0;
            $deliveryCost = (float) ($data['delivery_cost'] ?? 0);

            $attributes = [
                'job_ticket_id' => $jobTicket?->id,
                'customer_id' => $customer?->id,
                'company_profile_id' => $companyProfile->id,
                'customer_name_snapshot' => $customerName,
                'customer_company_snapshot' => $jobTicket?->customer_perusahaan_snapshot ?: $customer?->nama_perusahaan ?: ($data['customer_company'] ?? null),
                'customer_phone_snapshot' => $customer?->no_hp ?: ($data['customer_phone'] ?? null),
                'customer_address_snapshot' => $customer?->alamat_detail ?: ($data['customer_address'] ?? null),
                'source_type' => $jobTicket ? 'job_ticket' : 'manual',
                'valid_until' => $data['valid_until'] ?? now()->addDays(30)->toDateString(),
                'payment_terms' => $data['payment_terms'] ?? null,
                'delivery_terms' => $data['delivery_terms'] ?? null,
                'notes' => $data['notes'] ?? null,
                'quantity' => $quantity,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'delivery_cost' => $deliveryCost,
                'grand_total' => $subtotal + $tax + $deliveryCost,
            ];

            if (!$quotation) {
                $attributes += [
                    'quotation_number' => $this->generateQuotationNumber(),
                    'status' => 'draft',
                    'created_by' => Auth::id(),
                ];
                $quotation = Quotation::create($attributes);
            } else {
                $quotation->update($attributes);
            }

            $quotation->quotationNotes()->delete();
            $quotation->items()->delete();
            foreach ($data['items'] as $item) {
                $quotationItem = $quotation->items()->create([
                    'pesanan_id' => $item['pesanan_id'] ?? null,
                    'item_name' => $item['item_name'],
                    'fabric' => $item['fabric'] ?? null,
                    'print_method' => $item['print_method'] ?? null,
                    'quantity' => $item['quantity'],
                    'sample_quantity' => $item['sample_quantity'] ?? 0,
                    'sample_price_per_pcs' => $item['sample_price_per_pcs'] ?? 0,
                    'price_per_pcs' => $item['price_per_pcs'],
                    'subtotal' => (int) $item['quantity'] * (float) $item['price_per_pcs'],
                ]);

                if ($jobTicket && $quotationItem->pesanan) {
                    $quotationItem->pesanan->update([
                        'harga_jual_per_pcs' => $quotationItem->price_per_pcs,
                        'sample_qty' => $quotationItem->sample_quantity,
                        'harga_sample_per_pcs' => $quotationItem->sample_price_per_pcs,
                    ]);
                }
            }

            if ($jobTicket && !$wasAlreadyLinked) {
                $this->syncQuotationToJobTicket($quotation, $jobTicket);
            }

            return $quotation->refresh();
        });
    }

    public function attach(Quotation $quotation, JobTicket $jobTicket, array $mappings): void
    {
        if ($quotation->status !== 'draft' || $quotation->job_ticket_id) {
            abort(422, 'Hanya quotation draft yang belum terhubung ke PO yang dapat dipilih.');
        }

        $jobTicket->loadMissing('customer', 'companyProfile', 'pesanans');
        $quotation->loadMissing('customer', 'items');

        $sameCustomer = $quotation->customer_id && $jobTicket->customer_id
            ? (int) $quotation->customer_id === (int) $jobTicket->customer_id
            : mb_strtolower(trim((string) $quotation->customer_company_snapshot)) === mb_strtolower(trim((string) ($jobTicket->customer_perusahaan_snapshot ?: $jobTicket->customer?->nama_perusahaan)));

        if (!$sameCustomer) {
            abort(422, 'Quotation draft hanya dapat dihubungkan ke PO dengan customer yang sama.');
        }

        $orderIds = $jobTicket->pesanans->pluck('id')->map(fn ($id) => (int) $id)->all();
        $itemIds = $quotation->items->pluck('id')->map(fn ($id) => (int) $id)->all();
        $mappedIds = [];
        foreach ($mappings as $index => $mapping) {
            if (!in_array((int) $mapping['id'], $itemIds, true) || !in_array((int) $mapping['pesanan_id'], $orderIds, true)) {
                throw ValidationException::withMessages([
                    "items.{$index}.pesanan_id" => 'Pemetaan item tidak sesuai dengan quotation atau PO tujuan.',
                ]);
            }
            if (in_array((int) $mapping['id'], $mappedIds, true)) {
                abort(422, 'Item quotation tidak boleh dipetakan lebih dari sekali.');
            }
            $mappedIds[] = (int) $mapping['id'];
        }

        if (count($mappedIds) !== count($itemIds)) {
            abort(422, 'Semua item quotation harus dipetakan ke pesanan pada PO.');
        }

        DB::transaction(function () use ($quotation, $jobTicket, $mappings) {
            foreach ($mappings as $mapping) {
                $item = $quotation->items()->findOrFail($mapping['id']);
                $pesanan = $jobTicket->pesanans->firstWhere('id', (int) $mapping['pesanan_id']);
                $item->update(['pesanan_id' => $pesanan->id]);
                $pesanan->update([
                    'harga_jual_per_pcs' => $item->price_per_pcs,
                    'sample_qty' => $item->sample_quantity,
                    'harga_sample_per_pcs' => $item->sample_price_per_pcs,
                ]);
            }

            $quotation->update([
                'job_ticket_id' => $jobTicket->id,
                'source_type' => 'job_ticket',
                'customer_id' => $jobTicket->customer_id ?: $quotation->customer_id,
                'company_profile_id' => $jobTicket->company_profile_id ?: $quotation->company_profile_id,
                'customer_name_snapshot' => $jobTicket->customer_nama_snapshot ?: $jobTicket->customer?->nama ?: $quotation->customer_name_snapshot,
                'customer_company_snapshot' => $jobTicket->customer_perusahaan_snapshot ?: $jobTicket->customer?->nama_perusahaan ?: $quotation->customer_company_snapshot,
                'customer_phone_snapshot' => $jobTicket->customer?->no_hp ?: $quotation->customer_phone_snapshot,
                'customer_address_snapshot' => $jobTicket->customer?->alamat_detail ?: $quotation->customer_address_snapshot,
            ]);

            $this->syncQuotationToJobTicket($quotation, $jobTicket);
        });
    }

    private function syncQuotationToJobTicket(Quotation $quotation, JobTicket $jobTicket): void
    {
        foreach ($jobTicket->pesanans as $pesanan) {
            $pesanan->workflowStatus()->updateOrCreate(
                ['pesanan_id' => $pesanan->id],
                ['quotation_created' => true]
            );
        }

        $jobTicket->update(['status' => 'Quotation']);
        $jobTicket->workflowHistory()->create([
            'step' => 'quotation',
            'action' => 'draft_created_or_attached',
            'user_id' => Auth::id(),
            'notes' => "Quotation draft {$quotation->quotation_number} ditautkan ke PO.",
        ]);
    }

    private function generateQuotationNumber(): string
    {
        $prefix = 'QUO/' . now()->format('Y/m');
        $last = Quotation::query()
            ->where('quotation_number', 'like', $prefix . '/%')
            ->latest('id')
            ->first();
        $nextNumber = $last ? ((int) last(explode('/', $last->quotation_number)) + 1) : 1;

        return $prefix . '/' . str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);
    }
}