<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCompanyProfileRequest;
use App\Http\Requests\UpdateCompanyProfileRequest;
use App\Models\CompanyProfile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CompanyProfileController extends Controller
{
    public function index()
    {
        $profiles = CompanyProfile::query()
            ->latest()
            ->get()
            ->map(fn ($profile) => [
                'id' => $profile->id,
                'company_name' => $profile->company_name,
                'company_type' => $profile->company_type,
                'bank_type' => $profile->bank_type,
                'tax_percentage' => (int) $profile->tax_percentage,
                'account_number' => $profile->account_number,
                'account_name' => $profile->account_name,
                'address' => $profile->address,
                'swift_code' => $profile->swift_code,
                'stamp' => $profile->stamp,
                'stamp_url' => $profile->stamp_url,
            ]);

        return Inertia::render('admin/master/company-profiles/Index', [
            'companyProfiles' => $profiles,
        ]);
    }

    public function store(StoreCompanyProfileRequest $request)
    {
        $validated = $request->validated();
        if ($request->hasFile('stamp')) {
            $validated['stamp'] = $request->file('stamp')->store('stamps', 'public');
        }

        CompanyProfile::create($validated);

        return back();
    }

    public function update(UpdateCompanyProfileRequest $request, CompanyProfile $companyProfile)
    {
        $validated = $request->validated();
        if ($request->hasFile('stamp')) {
            if ($companyProfile->stamp && Storage::disk('public')->exists($companyProfile->stamp)) {
                Storage::disk('public')->delete($companyProfile->stamp);
            }
            $validated['stamp'] = $request->file('stamp')->store('stamps', 'public');
        }

        $companyProfile->update($validated);

        return back();
    }

    public function destroy(CompanyProfile $companyProfile)
    {
        $companyProfile->delete();

        return back();
    }
}
