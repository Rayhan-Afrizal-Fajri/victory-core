<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Exceptions\ImpersonationReadOnlyException;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * "Lihat sebagai": allows an Engineer / Super Admin to view the application
 * exactly as another user sees it, without logging in as that account and
 * strictly in read-only mode.
 *
 * The session stays the Super Admin's. It only stores the target user ID
 * (`SESSION_TARGET`); on every request `resume()` validates that this is still
 * permitted and swaps the guard user via `Auth::setUser()` — no login, no
 * remember-token or session ownership change. At the end of the request,
 * `release()` restores the original user before session persistence.
 */
class ImpersonationService
{
    /** Session key storing the ID of the account being viewed. */
    public const SESSION_TARGET = 'impersonation.target_id';

    public const NESTING_REFUSED = 'Akhiri mode "Lihat sebagai" yang sedang berjalan sebelum berpindah ke akun lain.';

    /** Role names (case-insensitive) authorized to use "Lihat sebagai". */
    private const ALLOWED_ACTOR_ROLES = [
        'super admin',
        'super_admin',
        'super-admin',
        'superadmin',
        'engineer',
        'owner',
    ];

    /** Role names (case-insensitive) that cannot be impersonated as targets. */
    private const PROTECTED_TARGET_ROLES = [
        'super admin',
        'super_admin',
        'super-admin',
        'superadmin',
        'engineer',
    ];

    private ?User $impersonator = null;

    private ?User $target = null;

    public function isActive(): bool
    {
        return $this->impersonator !== null && $this->target !== null;
    }

    /** The real Super Admin / Engineer who is viewing, or null when inactive. */
    public function impersonator(): ?User
    {
        return $this->impersonator;
    }

    /** The target account being viewed, or null when inactive. */
    public function target(): ?User
    {
        return $this->target;
    }

    /** Who is really signed in: the impersonator while active, otherwise the request user. */
    public function realUser(Request $request): ?User
    {
        /** @var User|null $user */
        $user = $this->impersonator ?? $request->user();

        return $user;
    }

    /**
     * Shared Inertia payload for rendering the impersonation banner, or null when inactive.
     *
     * @return array{
     *     is_active: bool,
     *     impersonator: array{id: int, name: string, email: string, role: string},
     *     target: array{id: int, name: string, email: string, role: string}
     * }|null
     */
    public function viewData(): ?array
    {
        if ($this->impersonator === null || $this->target === null) {
            return null;
        }

        return [
            'is_active' => true,
            'impersonator' => [
                'id' => (int) $this->impersonator->getKey(),
                'name' => $this->impersonator->name,
                'email' => $this->impersonator->email,
                'role' => $this->impersonator->roles->first()?->name ?? 'Super Admin',
            ],
            'target' => [
                'id' => (int) $this->target->getKey(),
                'name' => $this->target->name,
                'email' => $this->target->email,
                'role' => $this->target->roles->first()?->name ?? 'Pengguna',
            ],
        ];
    }

    /**
     * Checks whether a user is authorized to use "Lihat sebagai" (Super Admin / Engineer / Owner).
     */
    public function isAuthorizedActor(User $user): bool
    {
        $roleNames = $user->roles
            ->pluck('name')
            ->map(static fn (string $name): string => strtolower(trim($name)))
            ->all();

        foreach (self::ALLOWED_ACTOR_ROLES as $allowed) {
            if (in_array($allowed, $roleNames, true)) {
                return true;
            }
        }

        return strtolower((string) $user->email) === 'engineer@victorylabs.id';
    }

    /**
     * Checks whether a target user has Super Admin / Engineer privileges (protected from impersonation).
     */
    public function isSuperAdmin(User $user): bool
    {
        $roleNames = $user->roles
            ->pluck('name')
            ->map(static fn (string $name): string => strtolower(trim($name)))
            ->all();

        foreach (self::PROTECTED_TARGET_ROLES as $protected) {
            if (in_array($protected, $roleNames, true)) {
                return true;
            }
        }

        return strtolower((string) $user->email) === 'engineer@victorylabs.id';
    }

    /**
     * Why `$actor` may not view as `$target`, or null when allowed.
     * Re-checked on every request so deactivation or role changes take effect immediately.
     */
    public function refusalReason(User $actor, User $target): ?string
    {
        return match (true) {
            ! $actor->is_active || ! $this->isAuthorizedActor($actor) => 'Hanya Super Admin, Engineer, atau Owner yang dapat melihat sebagai pengguna lain.',
            $actor->is($target) => 'Anda tidak dapat melihat sebagai akun sendiri.',
            $this->isSuperAdmin($target) => 'Anda tidak dapat melihat sebagai Super Admin.',
            ! $target->is_active => 'Akun '.$target->name.' nonaktif.',
            default => null,
        };
    }

    /**
     * Whether `$actor` may start viewing as `$target` right now.
     */
    public function canStart(User $actor, User $target): bool
    {
        return ! $this->isActive() && $this->refusalReason($actor, $target) === null;
    }

    /**
     * Starts read-only impersonation for subsequent requests.
     *
     * @throws ImpersonationReadOnlyException When not permitted.
     */
    public function start(Request $request, User $actor, User $target): void
    {
        if ($this->isActive()) {
            throw new ImpersonationReadOnlyException(self::NESTING_REFUSED);
        }

        $reason = $this->refusalReason($actor, $target);

        if ($reason !== null) {
            throw new ImpersonationReadOnlyException($reason);
        }

        $request->session()->put(self::SESSION_TARGET, $target->getKey());
    }

    /**
     * Ends the active impersonation session.
     *
     * @return User|null The user that was being viewed, or null if not active.
     */
    public function stop(Request $request): ?User
    {
        $target = $this->target;

        $request->session()->forget(self::SESSION_TARGET);
        $this->release();

        return $target;
    }

    /**
     * Applies impersonation to the current request if stored in session.
     *
     * @return string|null Notice message if impersonation had to be terminated automatically.
     */
    public function resume(Request $request): ?string
    {
        $this->release();

        $targetId = $request->session()->get(self::SESSION_TARGET);

        if ($targetId === null) {
            return null;
        }

        /** @var User|null $actor */
        $actor = $request->user();

        if ($actor === null) {
            $request->session()->forget(self::SESSION_TARGET);

            return null;
        }

        $actor->loadMissing('roles');

        $target = User::query()->with('roles')->find($targetId);
        $reason = $target === null
            ? 'Akun yang dilihat sudah tidak ada.'
            : $this->refusalReason($actor, $target);

        if ($reason === null) {
            $this->activate($actor, $target);

            return null;
        }

        $request->session()->forget(self::SESSION_TARGET);
        $this->release();

        return 'Mode "Lihat sebagai" dihentikan. '.$reason;
    }

    /**
     * Swaps the guard user to `$target` for the duration of this request only.
     */
    public function activate(User $actor, User $target): void
    {
        $this->impersonator = $actor;
        $this->target = $target;

        Auth::guard()->setUser($target);
    }

    /**
     * Restores the original Super Admin / Engineer back to the auth guard.
     */
    public function release(): void
    {
        if ($this->impersonator === null) {
            return;
        }

        Auth::guard()->setUser($this->impersonator);

        $this->impersonator = null;
        $this->target = null;
    }

    /**
     * Whether saving/updating/deleting `$model` is permitted.
     * Always false while viewing as another user.
     */
    public function permitsWriting(Model $model): bool
    {
        return ! $this->isActive();
    }
}

