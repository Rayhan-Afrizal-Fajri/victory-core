<?php

declare(strict_types=1);

namespace App\Providers;

use App\Exceptions\ImpersonationReadOnlyException;
use App\Models\User;
use App\Services\Auth\ImpersonationService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class ImpersonationServiceProvider extends ServiceProvider
{
    /** Eloquent events that indicate a database write. */
    private const WRITING_MODEL_EVENTS = [
        'saving',
        'updating',
        'deleting',
        'forceDeleting',
        'restoring',
    ];

    public function register(): void
    {
        $this->app->singleton(ImpersonationService::class);
    }

    public function boot(): void
    {
        $this->configureGate();
        $this->guardModelWrites();
    }

    private function configureGate(): void
    {
        Gate::define(
            'impersonate',
            static fn (User $actor, User $target): bool => app(ImpersonationService::class)->canStart($actor, $target)
        );
    }

    /**
     * Safety net beneath the HTTP middleware: prevents any Eloquent model write
     * (even during a GET request) while read-only impersonation is active.
     */
    private function guardModelWrites(): void
    {
        foreach (self::WRITING_MODEL_EVENTS as $event) {
            Event::listen('eloquent.'.$event.': *', static function (string $eventName, array $payload): void {
                $model = $payload[0] ?? null;

                if ($model instanceof Model && ! app(ImpersonationService::class)->permitsWriting($model)) {
                    throw new ImpersonationReadOnlyException;
                }
            });
        }
    }
}

