<?php

namespace Tests\Feature;

use App\Models\DefaultSizeBreakdown;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DefaultSizeBreakdownControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_update_and_delete_default_size_breakdown(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->post(route('size-breakdowns.store'), [
            'type' => 'size',
            'label' => 'XL',
        ])->assertRedirect();

        $breakdown = DefaultSizeBreakdown::latest()->first();

        $this->assertNotNull($breakdown);
        $this->assertSame('size', $breakdown->type);
        $this->assertSame('XL', $breakdown->label);

        $this->patch(route('size-breakdowns.update', $breakdown), [
            'type' => 'fabric',
            'label' => 'Cotton',
        ])->assertRedirect();

        $breakdown->refresh();

        $this->assertSame('fabric', $breakdown->type);
        $this->assertSame('Cotton', $breakdown->label);

        $this->delete(route('size-breakdowns.destroy', $breakdown))->assertRedirect();

        $this->assertDatabaseMissing('default_size_breakdowns', ['id' => $breakdown->id]);
    }
}
