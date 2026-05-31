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
use App\Http\Controllers\ManufacturingWorkController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductManufacturingWorkController;
use App\Http\Controllers\ProductMaterialController;
use App\Http\Controllers\Admin\QuotationController;
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

    /**
     * Master Data
     */
    // Product/Article Master
    Route::resource('products', ProductController::class);
    Route::patch('/products/{product}/toggle-active', [ProductController::class, 'toggleActive'])
        ->name('products.toggle-active');

    // Material Master
    Route::resource('materials', MaterialController::class);
    Route::patch('/materials/{material}/toggle-active', [MaterialController::class, 'toggleActive'])
        ->name('materials.toggle-active');

    // Manufacturing Work Master
    Route::resource('manufacturing-works', ManufacturingWorkController::class);
    Route::patch('/manufacturing-works/{manufacturingWork}/toggle-active', [ManufacturingWorkController::class, 'toggleActive'])
        ->name('manufacturing-works.toggle-active');

    // Product Materials (BOM)
    Route::resource('product-materials', ProductMaterialController::class)->only(['store', 'update', 'destroy']);

    // Product Manufacturing Works (BOM)
    Route::resource('product-manufacturing-works', ProductManufacturingWorkController::class)->only(['store', 'update', 'destroy']);

    Route::resource('order-entry', OrderEntryController::class);
    
    // Route::resource('purchasings', PurchasingController::class);
    Route::resource('production-progress', ProductionProgressController::class);

    Route::resource('job-tickets', JobTicketController::class);


    /**
     * For detail job-tickets
     */
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

    Route::post('/pesanan/{pesanan}/sync-article', [DesignController::class, 'syncArticle'])
        ->name('designs.sync-article');

    Route::patch('/design-material-specs/{spec}', [DesignController::class, 'updateMaterialSpec'])
        ->name('design-material-specs.update');

    Route::patch('/design-manufacturing-specs/{spec}', [DesignController::class, 'updateManufacturingSpec'])
        ->name('design-manufacturing-specs.update');

    Route::patch('/pesanan/{pesanan}/owner-selling-price', [DesignController::class, 'updateOwnerSellingPrice'])
        ->name('designs.owner-selling-price');

    /**
     * Quotations
     */

    Route::post('/pesanan/{pesanan}/quotations/generate', [QuotationController::class, 'generate'])
        ->name('quotations.generate');

    Route::patch('/quotations/{quotation}', [QuotationController::class, 'update'])
        ->name('quotations.update');

    Route::patch('/quotations/{quotation}/approve', [QuotationController::class, 'approve'])
        ->name('quotations.approve');

    Route::patch('/quotations/{quotation}/reject', [QuotationController::class, 'reject'])
        ->name('quotations.reject');

    Route::get('/quotations/{quotation}/print', [QuotationController::class, 'print'])
        ->name('quotations.print');

    Route::delete('/quotations/{quotation}', [QuotationController::class, 'destroy'])
        ->name('quotations.destroy');

    

    /**
     * Samples
     */
    Route::post('/pesanan/{id}/samples', [SampleController::class, 'store'])
        ->name('samples.store');

    Route::post('/samples/{id}/media', [SampleController::class, 'uploadMedia'])
        ->name('samples.media.store');

    Route::patch('/samples/{sample}', [SampleController::class, 'update'])
        ->name('samples.update');

    Route::delete('/sample/{sample}', [SampleController::class, 'destroy'])
        ->name('samples.destroy');

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


    /**
     * Invoices
     */
    Route::resource('invoices', InvoiceController::class);

    Route::patch('/invoices/{invoice}/cancel', [InvoiceController::class, 'cancel'])
        ->name('invoices.cancel');

    /**
     * Payment
     */
    Route::post('/invoices/{id}/payments', [PaymentController::class, 'store'])
        ->name('invoices.payments.store');

    Route::patch('/payments/{id}/verify', [PaymentController::class, 'verifyPayment'])
        ->name('payments.verify');

    Route::patch('/payments/{id}/reject', [PaymentController::class, 'rejectPayment'])
        ->name('payments.reject');

    Route::patch('/payments/{payment}', [PaymentController::class, 'update'])
        ->name('payments.update');

    Route::delete('/payments/{payment}', [PaymentController::class, 'destroy'])
        ->name('payments.destroy');

    //delivery
    Route::patch('/samples/{sample}/delivery', [SampleController::class, 'updateDelivery'])
        ->name('samples.delivery.update');

    Route::delete('/samples/{sample}/delivery', [SampleController::class, 'cancelDelivery'])
        ->name('samples.delivery.cancel');

    //gallery
    Route::delete('/samples/media/{media}', [SampleController::class, 'deleteMedia'])
        ->name('samples.media.destroy');


    /**
     * Purchasing
     */
    Route::post('/pesanan/{pesanan}/purchasings/generate-from-bom', [PurchasingController::class, 'generateFromBom'])
    ->name('purchasings.generate-from-bom');

    Route::patch('/purchasings/{purchasing}/po', [PurchasingController::class, 'updatePoItem'])
        ->name('purchasings.update-po-item');

    Route::get('/purchasings', [PurchasingController::class, 'index'])
    ->name('purchasings.index');

    Route::post('/pesanan/{pesanan}/purchasings', [PurchasingController::class, 'store'])
    ->name('purchasings.store');

    Route::patch('/purchasings/{purchasing}', [PurchasingController::class, 'update'])
        ->name('purchasings.update');

    Route::delete('/purchasings/{purchasing}', [PurchasingController::class, 'destroy'])
        ->name('purchasings.destroy');

    Route::patch('/purchasings/{purchasing}/mark-ordered', [PurchasingController::class, 'markOrdered'])
        ->name('purchasings.mark-ordered');

    Route::post('/purchasings/{purchasing}/receivings', [PurchasingController::class, 'storeReceiving'])
        ->name('purchasings.receivings.store');

    Route::delete('/material-receivings/{receiving}', [PurchasingController::class, 'destroyReceiving'])
        ->name('material-receivings.destroy');

    /**
     * End of detail job tickets
     */
        
    
    Route::resource('profit-loss-report', ProfitLossReportController::class);
});

require __DIR__.'/settings.php';

Route::fallback(function () {
    return Inertia::render('errors/NotFound')->toResponse(request())->setStatusCode(404);
});
