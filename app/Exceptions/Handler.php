<?php

namespace App\Exceptions;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that should not be reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e)
    {
        if ($request->header('X-Inertia')) {
            if (
                $e instanceof ModelNotFoundException ||
                $e instanceof NotFoundHttpException ||
                ($e instanceof HttpExceptionInterface && $e->getStatusCode() === 404)
            ) {
                return Inertia::render('errors/NotFound')
                    ->toResponse($request)
                    ->setStatusCode(404);
            }

            return Inertia::render('errors/ServerError', [
                'message' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred.',
            ])
                ->toResponse($request)
                ->setStatusCode(500);
        }

        return parent::render($request, $e);
    }
}
