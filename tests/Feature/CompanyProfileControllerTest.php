<?php

namespace Tests\Feature;

use App\Models\CompanyProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyProfileControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_update_and_delete_company_profile(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->post(route('company-profiles.store'), [
            'company_name' => 'Victory Core',
            'company_type' => 'pkp',
            'bank_type' => 'BCA',
            'tax_percentage' => 11,
            'account_number' => '1234567890',
            'account_name' => 'Victory Core',
            'address' => 'Jakarta',
            'swift_code' => 'CENAIDJA',
        ])->assertRedirect();

        $profile = CompanyProfile::latest()->first();

        $this->assertNotNull($profile);
        $this->assertSame('Victory Core', $profile->company_name);

        $this->patch(route('company-profiles.update', $profile), [
            'company_name' => 'Victory Core Updated',
            'company_type' => 'non_pkp',
            'bank_type' => 'Mandiri',
            'tax_percentage' => 0,
            'account_number' => '0987654321',
            'account_name' => 'Victory Core Updated',
            'address' => 'Bandung',
            'swift_code' => 'BMRIIDJA',
        ])->assertRedirect();

        $profile->refresh();

        $this->assertSame('Victory Core Updated', $profile->company_name);
        $this->assertSame('non_pkp', $profile->company_type);

        $this->delete(route('company-profiles.destroy', $profile))->assertRedirect();

        $this->assertDatabaseMissing('company_profiles', ['id' => $profile->id]);
    }
}
