<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Exceptions\ImpersonationReadOnlyException;
use App\Services\Auth\ImpersonationService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Applies "Lihat sebagai" (read-only impersonation) for the duration of the request.
 *
 * Must run BEFORE `HandleInertiaRequests` so that shared auth props (`auth.user`,
 * `auth.roles`, `auth.permissions`, and `impersonation`) reflect the target user.
 *
 * All non-safe HTTP methods (POST, PUT, PATCH, DELETE) are blocked while active,
 * except for leaving routes (`impersonate.stop` and `logout`).
 */
class ApplyImpersonation
{
    /** Routes that remain callable while impersonating. */
    private const LEAVING_ROUTES = ['impersonate.stop', 'logout'];

    public function __construct(
        private readonly ImpersonationService $impersonation,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $endedNotice = $this->impersonation->resume($request);

        try {
            if ($endedNotice !== null) {
                $request->session()->flash('warning', $endedNotice);
                $request->session()->flash('flash_id', (string) Str::uuid());

                if (! $request->isMethodSafe() && ! $request->routeIs(self::LEAVING_ROUTES)) {
                    if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                        abort(Response::HTTP_CONFLICT, $endedNotice);
                    }

                    return redirect()->back();
                }
            }

            // If the user is signing out while impersonating, stop impersonation first
            // so logout operates on the real user session.
            if ($this->impersonation->isActive() && $request->routeIs('logout')) {
                $this->impersonation->stop($request);

                return $next($request);
            }

            if (
                $this->impersonation->isActive()
                && ! $request->isMethodSafe()
                && ! $request->routeIs(self::LEAVING_ROUTES)
            ) {
                throw $request->routeIs('users.impersonate')
                    ? new ImpersonationReadOnlyException(ImpersonationService::NESTING_REFUSED)
                    : new ImpersonationReadOnlyException;
            }

            return $next($request);
        } finally {
            // Restore the real user before session persistence so sessions.user_id
            // always remains the Super Admin's ID.
            $this->impersonation->release();
        }
    }
}

