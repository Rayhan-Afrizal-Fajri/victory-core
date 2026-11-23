<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Exceptions\ImpersonationReadOnlyException;
use App\Models\Role;
use App\Models\User;
use App\Services\Auth\ImpersonationService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ImpersonationTest extends TestCase
{
    private User $superAdmin;

    private User $designer;

    private User $otherSuperAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropAllTables();

        foreach ([
            'database/migrations/0001_01_01_000000_create_users_table.php',
            'database/migrations/2025_08_14_170933_add_two_factor_columns_to_users_table.php',
            'database/migrations/2026_05_12_133746_create_permission_tables.php',
            'database/migrations/2026_07_13_092323_create_notifications_table.php',
        ] as $migration) {
            Artisan::call('migrate', ['--path' => $migration]);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $designerRole = Role::firstOrCreate(['name' => 'Designer', 'guard_name' => 'web']);

        $dashboardPerm = Permission::firstOrCreate(['name' => 'dashboard.view', 'guard_name' => 'web']);
        $usersViewPerm = Permission::firstOrCreate(['name' => 'users.view', 'guard_name' => 'web']);

        $superAdminRole->syncPermissions([$dashboardPerm, $usersViewPerm]);
        $designerRole->syncPermissions([$dashboardPerm]);

        $this->superAdmin = User::factory()->create([
            'name' => 'Engineer',
            'email' => 'engineer@victorylabs.id',
            'is_active' => true,
        ]);
        $this->superAdmin->assignRole($superAdminRole);

        $this->designer = User::factory()->create([
            'name' => 'Designer Victory',
            'email' => 'designer@victorylabs.id',
            'is_active' => true,
        ]);
        $this->designer->assignRole($designerRole);

        $this->otherSuperAdmin = User::factory()->create([
            'name' => 'Other Super Admin',
            'email' => 'super2@victorylabs.id',
            'is_active' => true,
        ]);
        $this->otherSuperAdmin->assignRole($superAdminRole);
    }

    public function test_super_admin_can_start_viewing_as_another_user_and_sees_their_pov(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->post(route('users.impersonate', $this->designer));

        $response->assertRedirect(route('dashboard'));
        $response->assertSessionHas(ImpersonationService::SESSION_TARGET, $this->designer->id);

        $pageResponse = $this->actingAs($this->superAdmin)
            ->withSession([ImpersonationService::SESSION_TARGET => $this->designer->id])
            ->get(route('users.index'));

        $pageResponse->assertOk();
        $pageResponse->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.id', $this->designer->id)
            ->where('auth.user.name', 'Designer Victory')
            ->where('auth.roles.0', 'Designer')
            ->where('auth.permissions', ['dashboard.view'])
            ->where('impersonation.is_active', true)
            ->where('impersonation.impersonator.id', $this->superAdmin->id)
            ->where('impersonation.target.id', $this->designer->id)
        );
    }

    public function test_mutating_http_requests_are_blocked_in_read_only_mode(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->withSession([ImpersonationService::SESSION_TARGET => $this->designer->id])
            ->patch(route('users.update-status', $this->designer), [
                'is_active' => false,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('warning', ImpersonationReadOnlyException::MESSAGE);
        $response->assertSessionHasErrors('impersonation');

        $this->assertTrue((bool) $this->designer->fresh()->is_active);
    }

    public function test_eloquent_writes_are_blocked_while_impersonating(): void
    {
        $service = app(ImpersonationService::class);
        $service->activate($this->superAdmin, $this->designer);

        try {
            $this->expectException(ImpersonationReadOnlyException::class);
            $this->designer->update(['name' => 'Hacked Name']);
        } finally {
            $service->release();
        }
    }

    public function test_nested_impersonation_is_refused(): void
    {
        $anotherUser = User::factory()->create(['is_active' => true]);

        $response = $this->actingAs($this->superAdmin)
            ->withSession([ImpersonationService::SESSION_TARGET => $this->designer->id])
            ->post(route('users.impersonate', $anotherUser));

        $response->assertRedirect();
        $response->assertSessionHas('warning', ImpersonationService::NESTING_REFUSED);
        $this->assertEquals($this->designer->id, session(ImpersonationService::SESSION_TARGET));
    }

    public function test_super_admin_can_stop_impersonating(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->withSession([ImpersonationService::SESSION_TARGET => $this->designer->id])
            ->post(route('impersonate.stop'));

        $response->assertRedirect(route('users.index'));
        $response->assertSessionMissing(ImpersonationService::SESSION_TARGET);
        $response->assertSessionHas('success');
    }

    public function test_non_super_admin_cannot_impersonate(): void
    {
        $response = $this->actingAs($this->designer)
            ->post(route('users.impersonate', $this->superAdmin));

        $response->assertRedirect();
        $response->assertSessionMissing(ImpersonationService::SESSION_TARGET);
        $response->assertSessionHas('warning');
    }

    public function test_cannot_impersonate_self_another_super_admin_or_inactive_user(): void
    {
        // Self
        $this->actingAs($this->superAdmin)
            ->post(route('users.impersonate', $this->superAdmin))
            ->assertSessionMissing(ImpersonationService::SESSION_TARGET);

        // Another Super Admin
        $this->actingAs($this->superAdmin)
            ->post(route('users.impersonate', $this->otherSuperAdmin))
            ->assertSessionMissing(ImpersonationService::SESSION_TARGET);

        // Inactive user
        $inactive = User::factory()->create(['is_active' => false]);
        $this->actingAs($this->superAdmin)
            ->post(route('users.impersonate', $inactive))
            ->assertSessionMissing(ImpersonationService::SESSION_TARGET);
    }

    public function test_impersonation_auto_stops_when_target_is_deactivated(): void
    {
        $this->designer->update(['is_active' => false]);

        $response = $this->actingAs($this->superAdmin)
            ->withSession([ImpersonationService::SESSION_TARGET => $this->designer->id])
            ->get(route('users.index'));

        $response->assertOk();
        $response->assertSessionMissing(ImpersonationService::SESSION_TARGET);
        $response->assertSessionHas('warning');
        $response->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.id', $this->superAdmin->id)
            ->where('impersonation', null)
        );
    }

    public function test_owner_can_impersonate_regular_user_but_not_super_admin(): void
    {
        $ownerRole = Role::firstOrCreate(['name' => 'Owner', 'guard_name' => 'web']);
        $owner = User::factory()->create([
            'name' => 'Victor Harlim, SE. MBA',
            'email' => 'owner@victorylabs.id',
            'is_active' => true,
        ]);
        $owner->assignRole($ownerRole);

        // Owner cannot impersonate Super Admin (when not already impersonating)
        $this->actingAs($owner)
            ->post(route('users.impersonate', $this->superAdmin))
            ->assertSessionMissing(ImpersonationService::SESSION_TARGET)
            ->assertSessionHas('warning');

        // Owner can impersonate Designer
        $this->actingAs($owner)
            ->post(route('users.impersonate', $this->designer))
            ->assertRedirect(route('dashboard'))
            ->assertSessionHas(ImpersonationService::SESSION_TARGET, $this->designer->id);
    }

    public function test_users_index_exposes_can_impersonate_flags_correctly(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->get(route('users.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('users', 3)
            ->where('users', function ($users) {
                $byId = collect($users)->keyBy('id');

                return $byId[$this->designer->id]['can_impersonate'] === true
                    && $byId[$this->superAdmin->id]['can_impersonate'] === false
                    && $byId[$this->otherSuperAdmin->id]['can_impersonate'] === false;
            })
        );
    }
}
