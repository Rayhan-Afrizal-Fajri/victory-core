<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanyProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_name' => ['required', 'string', 'max:255'],
            'company_type' => ['required', Rule::in(['pkp', 'non_pkp'])],
            'bank_type' => ['required', 'string', 'max:255'],
            'tax_percentage' => ['nullable', 'integer', 'min:0', 'max:100'],
            'account_number' => ['required', 'string', 'max:255'],
            'account_name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string'],
            'swift_code' => ['nullable', 'string', 'max:255'],
        ];
    }
}
