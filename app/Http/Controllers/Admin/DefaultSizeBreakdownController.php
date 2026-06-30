<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDefaultSizeBreakdownRequest;
use App\Http\Requests\UpdateDefaultSizeBreakdownRequest;
use App\Models\DefaultSizeBreakdown;
use Inertia\Inertia;

class DefaultSizeBreakdownController extends Controller
{
    public function index()
    {
        $breakdowns = DefaultSizeBreakdown::query()
            ->latest()
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'type' => $item->type,
                'label' => $item->label,
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

    public function destroy(DefaultSizeBreakdown $sizeBreakdown)
    {
        $sizeBreakdown->delete();

        return back();
    }
}
