<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Thrown when a write/mutating action is attempted while a Super Admin / Engineer
 * is viewing the application as another user (read-only mode).
 */
class ImpersonationReadOnlyException extends RuntimeException
{
    public const MESSAGE = 'Mode hanya lihat sedang aktif. Tindakan ini tidak dijalankan.';

    public function __construct(string $message = self::MESSAGE, int $code = Response::HTTP_FORBIDDEN)
    {
        parent::__construct($message, $code);
    }

    public function report(): bool
    {
        return false;
    }
}

