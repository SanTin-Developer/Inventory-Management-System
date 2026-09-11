<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CommissionController;
use App\Http\Controllers\EmailChangeController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\RecommendationController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StockHistoryController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\TwoFactorController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Public routes — only login is open. Rate-limited to slow brute force.
Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
Route::get('email/confirm/{token}', [EmailChangeController::class, 'confirm']);

// Public — needed on the login page before auth exists
Route::get('settings/{key}', [SettingController::class, 'show']);

// Public but rate-limited — hit during login, before a token exists, so it
// must stay OUTSIDE the auth:sanctum group.
Route::post('2fa/verify', [TwoFactorController::class, 'verify'])->middleware('throttle:5,1');

// Authenticated routes
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {

    Route::get('dashboard', [DashboardController::class, 'index'])->middleware('permission:dashboard');
    Route::get('dashboard/low-stock', [DashboardController::class, 'lowStockAlerts'])->middleware('permission:dashboard');

    Route::middleware('permission:products')->group(function () {
        Route::get('products/stats', [ProductController::class, 'stats']);
        Route::get('products/all', [ProductController::class, 'all']);
        Route::apiResource('products', ProductController::class);
    });

    Route::middleware('permission:categories')->group(fn () => Route::apiResource('categories', CategoryController::class));

    Route::middleware('permission:suppliers')->group(fn () => Route::apiResource('suppliers', SupplierController::class));

    Route::middleware('permission:purchases')->group(function () {
        Route::get('purchases/stats', [PurchaseController::class, 'stats']);
        Route::apiResource('purchases', PurchaseController::class);
    });

    Route::middleware('permission:sales')->group(function () {
        Route::get('sales/stats', [SaleController::class, 'stats']);
        Route::apiResource('sales', SaleController::class);
    });

    Route::middleware('permission:customers')->group(fn () => Route::apiResource('customers', CustomerController::class));

    Route::middleware('permission:departments')->group(function () {
        Route::get('departments/all', [DepartmentController::class, 'all']);
        Route::apiResource('departments', DepartmentController::class);
    });

    Route::middleware('permission:roles')->group(function () {
        Route::get('roles/all', [RoleController::class, 'all']);
        Route::apiResource('roles', RoleController::class);
    });

    Route::middleware('permission:users')->group(function () {
        Route::get('users/stats', [UserController::class, 'stats']);
        Route::apiResource('users', UserController::class);
        Route::post('users/{user}/verify-password', [UserController::class, 'verifyPassword'])->middleware('throttle:5,1');
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
        Route::get('recommendations', [RecommendationController::class, 'index']);
        Route::get('products/{id}/recommendation', [RecommendationController::class, 'show']);
    });

    Route::middleware('permission:audit-logs')->group(function () {
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::get('audit-logs/{auditLog}', [AuditLogController::class, 'show']);
    });

    Route::middleware('permission:commissions')->group(function () {
        Route::post('sales/{saleId}/commission', [CommissionController::class, 'calculateForSale']);
        Route::get('users/{userId}/commissions', [CommissionController::class, 'forSeller']);
        Route::get('commissions/summary', [CommissionController::class, 'summary']);
    });

    // Own profile, permissions, 2FA, logout, and settings — no permission
    // check needed, any authenticated user may hit these.
    Route::get('user', [AuthController::class, 'profile']);
    Route::get('my-permissions', [AuthController::class, 'permissions']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('2fa/setup', [TwoFactorController::class, 'setup']);
    Route::post('2fa/confirm', [TwoFactorController::class, 'confirm']);
    Route::post('2fa/disable', [TwoFactorController::class, 'disable']);
    Route::post('email/request-change', [EmailChangeController::class, 'requestChange']);
    Route::get('search', [SearchController::class, 'search']);

    Route::put('settings/{key}', [SettingController::class, 'update']);

    Route::middleware('can-manage-salary-ranges')
        ->patch('roles/{role}/salary-range', [RoleController::class, 'updateSalaryRange']);
});
