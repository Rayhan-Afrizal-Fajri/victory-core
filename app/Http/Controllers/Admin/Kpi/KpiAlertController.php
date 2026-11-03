<?php

namespace App\Http\Controllers\Admin\Kpi;

use App\Http\Controllers\Controller;
use App\Models\Kpi\KpiAlert;
use App\Models\Kpi\KpiDefinition;
use Illuminate\Http\Request;

class KpiAlertController extends Controller
{
    public function acknowledge(Request $request, $id)
    {
        $alert = KpiAlert::find($id);
        if ($alert) {
            $alert->update([
                'is_acknowledged' => true,
                'acknowledged_by' => auth()->id(),
                'acknowledged_at' => now(),
            ]);
        }

        return back()->with('success', 'Peringatan anomali telah ditandai sebagai diketahui.');
    }

    public function saveTargets(Request $request)
    {
        $validated = $request->validate([
            'targets' => 'required|array',
            'targets.*.code' => 'required|string',
            'targets.*.target_value' => 'required|numeric',
        ]);

        foreach ($validated['targets'] as $t) {
            KpiDefinition::where('code', $t['code'])->update([
                'target_value' => $t['target_value'],
            ]);
        }

        return back()->with('success', 'Target metrik KPI berhasil diperbarui.');
    }
}
