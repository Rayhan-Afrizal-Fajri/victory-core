<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class RememberMeTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropAllTables();

        $mysqlOnlyMigrations = [
            '2026_09_26_075216_modify_quotations_table.php',
            '2026_10_03_000002_backfill_existing_quotation_snapshots.php',
            '2026_10_12_000001_update_job_ticket_id_cascade_on_quotations_table.php',
        ];

        $files = glob(database_path('migrations/*.php')) ?: [];
        sort($files);

        foreach ($files as $file) {
            $basename = basename($file);
            if (in_array($basename, $mysqlOnlyMigrations, true)) {
                if ($basename === '2026_09_26_075216_modify_quotations_table.php' && Schema::hasTable('quotations')) {
                    Schema::table('quotations', function (Blueprint $table) {
                        $table->unsignedBigInteger('job_ticket_id')->nullable()->change();
                    });
                }

                continue;
            }

            Artisan::call('migrate', ['--path' => 'database/migrations/' . $basename]);
        }
    }

    public function test_users_can_authenticate_with_remember_me_for_seven_days(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $recallerName = Auth::guard('web')->getRecallerName();

        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
            'remember' => 'on',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertNotNull($user->fresh()->getRememberToken());

        $recallerCookie = collect($response->headers->getCookies())
            ->first(fn ($cookie) => $cookie->getName() === $recallerName);

        $this->assertNotNull($recallerCookie);

        $expectedExpiry = now()->addDays(7)->getTimestamp();
        $this->assertEqualsWithDelta($expectedExpiry, $recallerCookie->getExpiresTime(), 30);
    }

    public function test_users_can_authenticate_without_remember_me_and_receive_no_recaller_cookie(): void
    {
        $user = User::factory()->create(['is_active' => true, 'remember_token' => null]);
        $recallerName = Auth::guard('web')->getRecallerName();

        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticatedAs($user);
        $this->assertEmpty($user->fresh()->getRememberToken());
        $response->assertCookieMissing($recallerName);
    }

    public function test_remember_me_cookie_reauthenticates_user_after_session_expires(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $recallerName = Auth::guard('web')->getRecallerName();

        $loginResponse = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
            'remember' => 'on',
        ]);

        $recallerCookie = collect($loginResponse->headers->getCookies())
            ->first(fn ($cookie) => $cookie->getName() === $recallerName);

        $this->assertNotNull($recallerCookie);

        // Simulate expired session / new browser visit with only the recaller cookie
        $this->app['auth']->forgetGuards();
        $this->app['session']->flush();

        $profileResponse = $this
            ->withUnencryptedCookie($recallerName, $recallerCookie->getValue())
            ->get(route('profile.edit'));

        $profileResponse->assertOk();
        $this->assertAuthenticatedAs($user);
        $this->assertTrue(Auth::viaRemember());
    }
}

