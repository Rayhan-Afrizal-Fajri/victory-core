<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\StoreDefaultSizeBreakdownRequest;
use App\Http\Requests\UpdateDefaultSizeBreakdownRequest;
use App\Models\DefaultSizeBreakdown;
use Inertia\Inertia;

class DefaultSizeBreakdownController extends Controller
{
    public function index()
    {
        $breakdowns = DefaultSizeBreakdown::query()
            ->orderBy('sequence', 'asc')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'type' => $item->type,
                'label' => $item->label,
                'sequence' => $item->sequence,
            ]);

        return Inertia::render('admin/master/size-breakdowns/index', [
            'defaultSizeBreakdowns' => $breakdowns,
        ]);
    }

    public function store(StoreDefaultSizeBreakdownRequest $request)
    {
        DefaultSizeBreakdown::create($request->validated());

        return back();
    }

    public function update(UpdateDefaultSizeBreakdownRequest $request, DefaultSizeBreakdown $sizeBreakdown)
    {
        $sizeBreakdown->update($request->validated());

        return back();
    }
    
    /**
     * Memperbarui urutan (sort_order) secara massal.
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'ordered_ids' => ['required', 'array'],
            'ordered_ids.*' => ['required', 'integer', 'exists:default_size_breakdowns,id'],
        ]);

        // Loop array id yang dikirimkan, lalu update sort_order-nya berdasarkan index array
        foreach ($validated['ordered_ids'] as $index => $id) {
        DefaultSizeBreakdown::where('id', $id)->update([
                'sequence' => $index + 1 // Urutan dimulai dari 1
            ]);
        }

        return back(); // Inertia akan me-reload props otomatis
    }

    public function destroy(DefaultSizeBreakdown $sizeBreakdown)
    {
        $sizeBreakdown->delete();

        return back();
    }
}
