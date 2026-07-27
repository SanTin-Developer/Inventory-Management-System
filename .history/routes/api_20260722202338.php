<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TwoFactorController;
use App\Http\Controllers\CategoryController as ControllersCategoryController;
use App\Http\Controllers\ProductController as ControllersProductController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\StockHistoryController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\SupplierController as ControllersSupplierController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\CommissionController;
use App\Http\Controllers\EmailChangeController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\SettingController;

// Public — only login is open
Route::post('login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::get('/email/confirm/{token}', [EmailChangeController::class, 'confirm']);

// Public - needed on the login page before auth exists
Route::get('/settings/{key}', [SettingController::class, 'show']);


// Public but rate-limited — hit during login, before a token exists,
// so it must stay OUTSIDE the auth:sanctum group.
Route::middleware('throttle:5,1')->post('/2fa/verify', [TwoFactorController::class, 'verify']);

// Authenticated routes
Route::middleware(['auth:sanctum'])->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('permission:dashboard');
    Route::get('/dashboard/low-stock', [DashboardController::class, 'lowStockAlerts'])->middleware('permission:dashboard');

    Route::middleware('permission:products')->group(function () {
        Route::apiResource('products', ControllersProductController::class);
        Route::get('/products/stats', [ControllersProductController::class, 'stats']);
        Route::get('/products/all', [ControllersProductController::class, 'all']);
    });

    Route::middleware('permission:categories')->group(fn() =>
    Route::apiResource('categories', ControllersCategoryController::class));

    Route::middleware('permission:suppliers')->group(fn() =>
    Route::apiResource('suppliers', ControllersSupplierController::class));

    Route::middleware('permission:purchases')->group(function () {
        Route::apiResource('purchases', PurchaseController::class);
        Route::get('/purchases/stats', [PurchaseController::class, 'stats']);
    });

    Route::middleware('permission:sales')->group(function () {
        Route::apiResource('sales', SaleController::class);
        Route::get('/sales/stats', [SaleController::class, 'stats']);
    });

    Route::middleware('permission:customers')->group(fn() =>
    Route::apiResource('customers', CustomerController::class));

    Route::middleware('permission:departments')->group(function () {
        Route::apiResource('departments', DepartmentController::class);
        Route::get('/departments/all', [DepartmentController::class, 'all']);
    });

    Route::middleware('permission:roles')->group(function () {
        Route::apiResource('roles', RoleController::class);
        Route::get('/roles/all', [RoleController::class, 'all']);
    });

    Route::middleware('permission:users')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::get('/users/stats', [UserController::class, 'stats']);
        Route::post('/users/{user}/verify-password', [UserController::class, 'verifyPassword']);
    });

    Route::middleware('permission:stock-histories')->group(function () {
        Route::get('stock-histories/stats', [StockHistoryController::class, 'stats']);
        Route::get('stock-histories', [StockHistoryController::class, 'index']);
        Route::get('stock-histories/{stockHistory}', [StockHistoryController::class, 'show']);
    });

    Route::middleware('permission:reports')->prefix('reports')->group(function () {
        Route::get('sales-summary', [ReportController::class, 'salesSummary']);
        Route::get('purchase-summary', [ReportController::class, 'purchaseSummary']);
        Route::get('inventory', [ReportController::class, 'inventory']);
        Route::get('top-products', [ReportController::class, 'topProducts']);
        Route::get('slow-moving', [ReportController::class, 'slowMovingProducts']);
    });

    Route::middleware('permission:recommendations')->group(function () {
        Route::get('/recommendations', [RecommendationController::class, 'index']);
        Route::get('/products/{id}/recommendation', [RecommendationController::class, 'show']);
    });

    Route::middleware('permission:audit-logs')->group(function () {
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::get('audit-logs/{auditLog}', [AuditLogController::class, 'show']);
    });

    Route::middleware('permission:commissions')->group(function () {
        Route::post('/sales/{saleId}/commission', [CommissionController::class, 'calculateForSale']);
        Route::get('/users/{userId}/commissions', [CommissionController::class, 'forSeller']);
        Route::get('/commissions/summary', [CommissionController::class, 'summary']);
    });

    // Everyone can hit their own profile/2FA/logout — no permission check needed
    Route::get('/user', fn(Request $request) => $request->user()->load('role', 'department'));
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('/2fa/setup', [TwoFactorController::class, 'setup']);
    Route::post('/2fa/confirm', [TwoFactorController::class, 'confirm']);
    Route::post('/2fa/disable', [TwoFactorController::class, 'disable']);
    Route::post('/email/request-change', [EmailChangeController::class, 'requestChange']);
    Route::get('/search', [SearchController::class, 'search']);
    Route::middleware('can-manage-salary-ranges')->patch('/roles/{role}/salary-range', [RoleController::class, 'updateSalaryRange']);
});
