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
use App\Http\Controllers\SearchController;

// Public — only login is open
Route::post('login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);


// Public but rate-limited — hit during login, before a token exists,
// so it must stay OUTSIDE the auth:sanctum group.
Route::middleware('throttle:5,1')->post('/2fa/verify', [TwoFactorController::class, 'verify']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user()->load('role', 'department');
    });

    Route::post('logout', [AuthController::class, 'logout']);

    // 2FA management — only a logged-in user can set up/confirm/disable
    // their own 2FA, so these belong inside this authenticated group.
    Route::post('/2fa/setup', [TwoFactorController::class, 'setup']);
    Route::post('/2fa/confirm', [TwoFactorController::class, 'confirm']);
    Route::post('/2fa/disable', [TwoFactorController::class, 'disable']);
    Route::post('/email/request-change', [EmailChangeController::class, 'requestChange']);
    // Route::post('/2fa/verify', [TwoFactorController::class, 'verify'])
    //     ->middleware('throttle:5,1');

    // Everyday operational data — any authenticated user
    Route::get('/dashboard', [App\Http\Controllers\Api\DashboardController::class, 'index']);
    Route::apiResource('categories', ControllersCategoryController::class);
    Route::apiResource('suppliers', ControllersSupplierController::class);
    Route::get('/products/stats', [ControllersProductController::class, 'stats']);
    Route::apiResource('products', ControllersProductController::class);
    Route::get('/purchases/stats', [PurchaseController::class, 'stats']);
    Route::apiResource('purchases', PurchaseController::class);
    Route::apiResource('departments', DepartmentController::class);
    Route::apiResource('roles', RoleController::class);
    Route::apiResource('customers', CustomerController::class);
    Route::get('/sales/stats', [SaleController::class, 'stats']);
    Route::apiResource('sales', SaleController::class);
    Route::get('/dashboard/low-stock', [App\Http\Controllers\Api\DashboardController::class, 'lowStockAlerts']);


    Route::prefix('reports')->group(function () {
        Route::get('sales-summary', [ReportController::class, 'salesSummary']);
        Route::get('purchase-summary', [ReportController::class, 'purchaseSummary']);
        Route::get('inventory', [ReportController::class, 'inventory']);
        Route::get('top-products', [ReportController::class, 'topProducts']);
        Route::get('slow-moving', [ReportController::class, 'slowMovingProducts']);
    });

    // Read-only — no store/update/destroy routes
    Route::get('audit-logs', [AuditLogController::class, 'index']);
    Route::get('audit-logs/{auditLog}', [AuditLogController::class, 'show']);

    Route::get('stock-histories/stats', [StockHistoryController::class, 'stats']);
    Route::get('stock-histories', [StockHistoryController::class, 'index']);
    Route::get('stock-histories/{stockHistory}', [StockHistoryController::class, 'show']);

    Route::middleware('can-manage-salary-ranges')
        ->patch('/roles/{role}/salary-range', [RoleController::class, 'updateSalaryRange']);

    Route::middleware('auth:sanctum')->get('/search', [SearchController::class, 'search']);
    // Admin-only — user management
    Route::middleware('role:Admin')->group(function () {
        Route::get('/users/stats', [UserController::class, 'stats']);
        Route::apiResource('users', UserController::class);
        Route::post('/users/{user}/verify-password', [UserController::class, 'verifyPassword']);
        Route::apiResource('roles', RoleController::class);
        Route::apiResource('departments', DepartmentController::class);
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::get('audit-logs/{auditLog}', [AuditLogController::class, 'show']);
    });
});
