<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Database\QueryException $e, \Illuminate\Http\Request $request) {
            \Illuminate\Support\Facades\Log::error('Database QueryException intercepted: ' . $e->getMessage(), [
                'sql' => $e->getSql(),
                'bindings' => $e->getBindings(),
                'url' => $request->fullUrl(),
            ]);

            $message = 'Terjadi kesalahan pada basis data saat memproses aksi. Harap periksa kelengkapan spesifikasi dan data.';

            if (str_contains($e->getMessage(), "cannot be null") || $e->getCode() == 23000) {
                if (preg_match("/Column '([^']+)' cannot be null/", $e->getMessage(), $matches)) {
                    $column = $matches[1] ?? 'data wajib';
                    $message = "Gagal memproses: Data '{$column}' wajib diisi namun masih kosong pada sistem. Silakan lengkapi data terkait terlebih dahulu.";
                } elseif (str_contains($e->getMessage(), "foreign key constraint fails") || str_contains($e->getMessage(), "1451") || str_contains($e->getMessage(), "1452")) {
                    $message = 'Aksi tidak dapat diproses karena data ini masih terhubung dengan data lain pada sistem.';
                } elseif (str_contains($e->getMessage(), "Duplicate entry") || str_contains($e->getMessage(), "1062")) {
                    $message = 'Data yang Anda masukkan sudah terdaftar di sistem (duplikasi).';
                }
            }

            if ($request->header('X-Inertia') || $request->wantsJson()) {
                return back()
                    ->with('error', $message)
                    ->with('flash_id', (string) \Illuminate\Support\Str::uuid())
                    ->withErrors(['error' => $message]);
            }
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpException $e, \Illuminate\Http\Request $request) {
            if ($e->getStatusCode() === 422 && ($request->header('X-Inertia') || $request->wantsJson())) {
                $message = $e->getMessage() ?: 'Validasi aksi tidak terpenuhi.';
                return back()
                    ->with('error', $message)
                    ->with('flash_id', (string) \Illuminate\Support\Str::uuid())
                    ->withErrors(['error' => $message]);
            }
        });
    })->create();
