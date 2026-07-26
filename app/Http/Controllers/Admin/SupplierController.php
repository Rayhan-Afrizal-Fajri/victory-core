<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Str;

class SupplierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $suppliers = Supplier::query()
            ->with('purchasing.pesanan')
            ->withCount('purchasing')
            ->orderByRaw('CAST(kategori AS CHAR) ASC')
            ->orderBy('nama_perusahaan', 'asc')
            ->orderBy('created_at', 'desc')
            // ->latest()
            ->get()
            ->map(fn ($sup) => [
                'id' => $sup->id,
                'name' => $sup->nama,
                'company_name' => $sup->nama_perusahaan,
                'category' => $sup->kategori,
                'contact' => $sup->kontak,
                'address' => $sup->alamat,
                'total_orders' => $sup->purchasing_count,
                'order_history' => $sup->purchasing->map(function ($purchase) {
                    return [
                        'id' => $purchase->id,
                        'job_ticket' => $purchase->pesanan?->jobTicket?->no_job_ticket,
                        'item_name' => $purchase->item_bahan,
                        'quantity'=> $purchase->qty_bahan,
                        'total_cost' => $purchase->total_harga,
                        'status' => $purchase->is_received ? 'Delivered' : 'Ordered',
                    ];
                })->values()
            ]);

        return Inertia::render('admin/suppliers/Index', [
            'suppliers' => $suppliers,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => ['nullable', 'string', 'max:255'],
            'nama_perusahaan' => ['required', 'string', 'max:255'],
            'kategori' => [
                'required',
                Rule::in(['Bahan Baku', 'Aksesoris', 'CMT / Makloon'])
            ],
            'kontak' => ['required', 'string', 'max:20'],
            'alamat' => ['required', 'string'],
        ]);

        Supplier::create($validated);

        return back();
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'nama' => ['nullable', 'string', 'max:255'],
            'nama_perusahaan' => ['required', 'string', 'max:255'],
            'kategori' => [
                'required',
                Rule::in(['Bahan Baku', 'Aksesoris', 'CMT / Makloon'])
            ],
            'kontak' => ['required', 'string', 'max:20'],
            'alamat' => ['required', 'string'],
        ]);

        // dd($validated);  

        $supplier->update($validated);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Supplier $supplier)
    {
        if (! $supplier->canBeDeleted()) {
            return back()->with([
                'error' => 'Proses ini sedang digunakan di tabel lain dan tidak dapat dihapus.',
                'flash_id' => Str::uuid(),
            ]);
        }
        $supplier->delete();

        return back();
    }
}
