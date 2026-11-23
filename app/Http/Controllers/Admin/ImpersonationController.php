<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Auth\ImpersonationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ImpersonationController extends Controller
{
    public function __construct(
        private readonly ImpersonationService $impersonation,
    ) {}

    public function start(Request $request, User $user): RedirectResponse
    {
        /** @var User $actor */
        $actor = $request->user();

        $this->impersonation->start($request, $actor, $user);

        return redirect()
            ->route('dashboard')
            ->with('success', 'Sekarang melihat sebagai '.$user->name.'. Mode hanya lihat (read-only).')
            ->with('flash_id', (string) Str::uuid());
    }

    public function stop(Request $request): RedirectResponse
    {
        $target = $this->impersonation->stop($request);

        if ($target === null) {
            return redirect()->route('dashboard');
        }

        return redirect()
            ->route('users.index')
            ->with('success', 'Selesai melihat sebagai '.$target->name.'.')
            ->with('flash_id', (string) Str::uuid());
    }
}

