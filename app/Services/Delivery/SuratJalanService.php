<?php

namespace App\Services\Delivery;

use App\Models\CompanyProfile;
use App\Models\JobTicket;
use App\Models\Pesanan;
use App\Models\ProductionRun;
use App\Models\SuratJalan;
use App\Models\SuratJalanItem;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SuratJalanService
{
    /**
     * Generate unique Surat Jalan Number (e.g. SD/00467)
     */
    public function generateNumber(): string
    {
        $prefix = 'SD/';

        // Find the latest record with SD/ prefix
        $latest = SuratJalan::where('surat_jalan_number', 'like', $prefix . '%')
            ->orderByDesc('id')
            ->first();

        $nextNumber = 1;

        if ($latest && preg_match('/^SD\/(\d+)$/', $latest->surat_jalan_number, $matches)) {
            $nextNumber = ((int) $matches[1]) + 1;
        } else {
            // Start from 467 if this is a fresh installation to match standard operational numbers
            $maxExisting = SuratJalan::count();
            $nextNumber = $maxExisting > 0 ? ($maxExisting + 1) : 467;
        }

        return $prefix . str_pad((string) $nextNumber, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Create or update Surat Jalan for a JobTicket
     */
    public function createOrUpdateForJobTicket(JobTicket $jobTicket, array $extra = []): SuratJalan
    {
        return DB::transaction(function () use ($jobTicket, $extra) {
            $suratJalan = SuratJalan::where('job_ticket_id', $jobTicket->id)->first();

            $customer = $jobTicket->customer;
            $companyProfile = $jobTicket->companyProfile 
                ?: CompanyProfile::find(2) 
                ?: CompanyProfile::first();

            $customerCompany = $jobTicket->customer_perusahaan_snapshot 
                ?: ($customer?->nama_perusahaan ?: $jobTicket->customer_nama_snapshot ?: 'Customer');
            $customerName = $jobTicket->customer_nama_snapshot 
                ?: ($customer?->nama ?: 'Customer');
            $customerPhone = $customer?->no_hp ?: ($customer?->kontak ?: '-');
            $customerAddress = $customer?->alamat_detail ?: '-';
            $customerPic = $jobTicket->customer_nama_snapshot ?: ($customer?->nama ?: '-');

            if (! $suratJalan) {
                $suratJalan = SuratJalan::create([
                    'job_ticket_id' => $jobTicket->id,
                    'pesanan_id' => $extra['pesanan_id'] ?? $jobTicket->pesanans->first()?->id,
                    'production_run_id' => $extra['production_run_id'] ?? null,
                    'surat_jalan_number' => $this->generateNumber(),
                    'delivery_date' => $extra['delivery_date'] ?? now()->format('Y-m-d'),
                    'company_profile_id' => $companyProfile?->id,
                    'customer_id' => $jobTicket->customer_id,
                    'customer_name_snapshot' => $customerName,
                    'customer_company_snapshot' => $customerCompany,
                    'customer_phone_snapshot' => $customerPhone,
                    'customer_address_snapshot' => $customerAddress,
                    'customer_pic_snapshot' => $customerPic,
                    'courier_name' => $extra['courier_name'] ?? null,
                    'tracking_number' => $extra['tracking_number'] ?? null,
                    'tracking_url' => $extra['tracking_url'] ?? null,
                    'vehicle_number' => $extra['vehicle_number'] ?? null,
                    'driver_name' => $extra['driver_name'] ?? null,
                    'notes' => $extra['notes'] ?? $extra['delivery_note'] ?? null,
                    'status' => $extra['status'] ?? 'ready_to_ship',
                    'created_by' => Auth::id() ?? 1,
                    'total_quantity' => 0,
                ]);
            } else {
                $updateData = [];
                if (isset($extra['courier_name'])) $updateData['courier_name'] = $extra['courier_name'];
                if (isset($extra['tracking_number'])) $updateData['tracking_number'] = $extra['tracking_number'];
                if (isset($extra['tracking_url'])) $updateData['tracking_url'] = $extra['tracking_url'];
                if (isset($extra['delivery_note'])) $updateData['notes'] = $extra['delivery_note'];
                if (isset($extra['notes'])) $updateData['notes'] = $extra['notes'];
                if (isset($extra['status'])) $updateData['status'] = $extra['status'];
                if (isset($extra['production_run_id'])) $updateData['production_run_id'] = $extra['production_run_id'];

                if (! empty($updateData)) {
                    $suratJalan->update($updateData);
                }
            }

            // Sync items if no items exist or explicit sync requested
            if ($suratJalan->items()->count() === 0) {
                $this->syncItemsFromJobTicket($suratJalan, $jobTicket);
            }

            return $suratJalan->fresh(['items', 'companyProfile', 'customer', 'jobTicket']);
        });
    }

    /**
     * Create or update Surat Jalan for a ProductionRun
     */
    public function createOrUpdateForProductionRun(ProductionRun $run, array $extra = []): SuratJalan
    {
        $pesanan = $run->pesanan;
        $jobTicket = $pesanan ? $pesanan->jobTicket : null;

        if (! $jobTicket) {
            throw new \InvalidArgumentException('Production Run must have an associated JobTicket.');
        }

        $extra['production_run_id'] = $run->id;
        $extra['pesanan_id'] = $pesanan->id;

        if (! empty($run->courier_name) && ! isset($extra['courier_name'])) {
            $extra['courier_name'] = $run->courier_name;
        }
        if (! empty($run->tracking_number) && ! isset($extra['tracking_number'])) {
            $extra['tracking_number'] = $run->tracking_number;
        }
        if (! empty($run->tracking_url) && ! isset($extra['tracking_url'])) {
            $extra['tracking_url'] = $run->tracking_url;
        }
        if (! empty($run->delivery_note) && ! isset($extra['notes'])) {
            $extra['notes'] = $run->delivery_note;
        }

        if ($run->status === 'delivered') {
            $extra['status'] = 'delivered';
            $extra['delivered_at'] = $run->delivered_at ?? now();
        } elseif ($run->status === 'in_delivery') {
            $extra['status'] = 'in_transit';
        }

        return $this->createOrUpdateForJobTicket($jobTicket, $extra);
    }

    /**
     * Sync items from JobTicket pesanans to SuratJalan
     */
    public function syncItemsFromJobTicket(SuratJalan $suratJalan, JobTicket $jobTicket): void
    {
        $pesanans = $jobTicket->pesanans()->with(['product', 'sizeBreakdowns'])->get();

        $totalQty = 0;
        $sort = 0;

        foreach ($pesanans as $pesanan) {
            // Clean product name (e.g. "Totte Bag Custom" -> "Tote Bag", "Kaos Katun Custom" -> "Kaos")
            $rawProductName = $pesanan->product?->name ?: $pesanan->produk;
            $cleanProductName = $this->cleanProductName($rawProductName);

            // Clean description (e.g. "Art: Drawstring Science Day")
            $description = $this->formatDescription($pesanan);

            $qty = (int) ($pesanan->q ?: 1);
            $totalQty += $qty;

            SuratJalanItem::create([
                'surat_jalan_id' => $suratJalan->id,
                'pesanan_id' => $pesanan->id,
                'product_name' => $cleanProductName,
                'description' => $description,
                'quantity' => $qty,
                'unit' => 'Pcs',
                'sort_order' => $sort++,
            ]);
        }

        $suratJalan->update([
            'total_quantity' => $totalQty,
        ]);
    }

    /**
     * Format clean product category/name
     */
    private function cleanProductName(?string $name): string
    {
        if (empty($name)) {
            return 'Produk Garment';
        }

        $cleaned = trim($name);

        // Normalize common garment names
        if (stripos($cleaned, 'totte') !== false || stripos($cleaned, 'tote') !== false) {
            return 'Tote Bag';
        }
        if (stripos($cleaned, 'jersey') !== false) {
            return 'Jersey Custom';
        }
        if (stripos($cleaned, 'pdh') !== false || stripos($cleaned, 'kemeja') !== false) {
            return 'Kemeja PDH';
        }
        if (stripos($cleaned, 'polo') !== false) {
            return 'Polo Shirt';
        }
        if (stripos($cleaned, 'hoodie') !== false) {
            return 'Hoodie Jacket';
        }
        if (stripos($cleaned, 'kaos') !== false || stripos($cleaned, 't-shirt') !== false) {
            return 'Kaos Custom';
        }

        // Strip " Custom" suffix if present
        $cleaned = preg_replace('/\s+Custom$/i', '', $cleaned);

        return $cleaned;
    }

    /**
     * Format description as in reference document: "Art: Drawstring Science Day"
     */
    private function formatDescription(Pesanan $pesanan): string
    {
        $desc = trim((string) ($pesanan->requested_product_name ?: $pesanan->produk));

        if (empty($desc)) {
            return 'Produksi Garment Standar';
        }

        // If it doesn't already start with "Art:", prefix it
        if (! str_starts_with($desc, 'Art:') && ! str_starts_with($desc, 'Art :')) {
            $desc = 'Art: ' . $desc;
        }

        return $desc;
    }
}
