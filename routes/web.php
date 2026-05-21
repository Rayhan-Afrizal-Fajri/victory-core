<?php

use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DesignController;
use App\Http\Controllers\Admin\InvoiceController;
use App\Http\Controllers\Admin\JobTicketController;
use App\Http\Controllers\Admin\KanbanBoardController;
use App\Http\Controllers\Admin\OrderEntryController;
use App\Http\Controllers\Admin\OrderSpecificationController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\Admin\ProductionProgressController;
use App\Http\Controllers\Admin\ProfitLossReportController;
use App\Http\Controllers\Admin\PurchasingController;
use App\Http\Controllers\Admin\SampleController;
use App\Http\Controllers\Admin\SupplierController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::resource('kanban-board', KanbanBoardController::class);

    Route::resource('users', UserController::class);
    Route::resource('customers', CustomerController::class);
    Route::resource('suppliers', SupplierController::class);

    Route::resource('order-entry', OrderEntryController::class);
    Route::resource('invoices', InvoiceController::class);
    Route::resource('payments', PaymentController::class);
    
    Route::resource('purchasings', PurchasingController::class);
    Route::resource('production-progress', ProductionProgressController::class);

    Route::resource('job-tickets', JobTicketController::class);
    Route::patch(
        '/pesanan/{id}/update-status',
        [JobTicketController::class, 'updateStatus']
    )->name('pesanan.update-status');

    Route::post('/pesanan/{id}/specifications', [OrderSpecificationController::class, 'updateSync'])->name('specifications.sync');

    Route::post('/pesanan/{id}/designs', [DesignController::class, 'store'])->name('designs.store');

    Route::patch(
        '/designs/{id}/approve-design',
        [DesignController::class, 'approveDesign']
    )->name('designs.approve');
    Route::patch('/designs/{id}/request-revision', [DesignController::class, 'requestRevision'])
    ->name('designs.revision');

    //samples
    Route::post('/pesanan/{id}/samples', [SampleController::class, 'store'])
    ->name('samples.store');

    Route::post('/samples/{id}/media', [SampleController::class, 'uploadMedia'])
    ->name('samples.media.store');

    Route::post('/samples/{id}/payments', [SampleController::class, 'submitPayment'])
        ->name('samples.payments.store');

    Route::patch('/payments/{id}/verify', [SampleController::class, 'verifyPayment'])
        ->name('sample-payments.verify');

    Route::patch('/payments/{id}/reject', [SampleController::class, 'rejectPayment'])
        ->name('sample-payments.reject');

    Route::post('/samples/{id}/delivery', [SampleController::class, 'ship'])
        ->name('samples.delivery.store');

    Route::patch('/samples/{id}/mark-delivered', [SampleController::class, 'markDelivered'])
        ->name('samples.delivery.delivered');

    Route::patch('/samples/{id}/approve', [SampleController::class, 'approve'])
        ->name('samples.approve');

    Route::patch('/samples/{id}/revision', [SampleController::class, 'requestRevision'])
        ->name('samples.revision');

    Route::patch('/samples/{id}/reject', [SampleController::class, 'reject'])
        ->name('samples.reject');
        
    
    Route::resource('profit-loss-report', ProfitLossReportController::class);
});

require __DIR__.'/settings.php';

Route::fallback(function () {
    return Inertia::render('errors/NotFound')->toResponse(request())->setStatusCode(404);
});
