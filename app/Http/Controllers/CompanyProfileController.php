<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCompanyProfileRequest;
use App\Http\Requests\UpdateCompanyProfileRequest;
use App\Models\CompanyProfile;
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
            ]);

        return Inertia::render('admin/master/company-profiles/Index', [
            'companyProfiles' => $profiles,
        ]);
    }

    public function store(StoreCompanyProfileRequest $request)
    {
        CompanyProfile::create($request->validated());

        return back();
    }

    public function update(UpdateCompanyProfileRequest $request, CompanyProfile $companyProfile)
    {
        $companyProfile->update($request->validated());

        return back();
    }

    public function destroy(CompanyProfile $companyProfile)
    {
        $companyProfile->delete();

        return back();
    }
}
