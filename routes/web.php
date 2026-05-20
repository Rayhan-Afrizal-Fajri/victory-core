<?php

use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\InvoiceController;
use App\Http\Controllers\Admin\JobTicketController;
use App\Http\Controllers\Admin\KanbanBoardController;
use App\Http\Controllers\Admin\OrderEntryController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\Admin\ProductionProgressController;
use App\Http\Controllers\Admin\ProfitLossReportController;
use App\Http\Controllers\Admin\PurchasingController;
use App\Http\Controllers\Admin\SupplierController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

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
        'pesanan/{id}/update-status',
        [JobTicketController::class, 'updateStatus']
    )->name('pesanan.update-status');
    Route::patch(
        'production-progress/{id}',
        [ProductionProgressController::class, 'update']
    )->name('production-progress.update');
    Route::patch(
        '/production-progress/{id}/toggle-sample',
        [ProductionProgressController::class, 'toggleSample']
    )->name('production-progress.toggle-sample');    

    // Design approval endpoint (used by UI to approve design)
    Route::patch('job-tickets/{id}/design-approve', [JobTicketController::class, 'approveDesign'])->name('job-tickets.design-approve');

    Route::resource('profit-loss-report', ProfitLossReportController::class);
});

require __DIR__.'/settings.php';

Route::fallback(function () {
    return Inertia::render('errors/NotFound')->toResponse(request())->setStatusCode(404);
});
