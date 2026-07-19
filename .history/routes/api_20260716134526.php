<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController as ControllersCategoryController;
use App\Http\Controllers\ProductController as ControllersProductController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\StockHistoryController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\SupplierController as ControllersSupplierController;
use App\Http\Controllers\UserController;

// Public — only login is open
Route::post('login', [AuthController::class, 'login']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('logout', [AuthController::class, 'logout']);

    // Everyday operational data — any authenticated user
    Route::get('/dashboard', [App\Http\Controllers\Api\DashboardController::class, 'index']);
    Route::apiResource('categories', ControllersCategoryController::class);
    Route::apiResource('suppliers', ControllersSupplierController::class);
    Route::apiResource('products', ControllersProductController::class);
    Route::apiResource('purchases', PurchaseController::class);
    Route::apiResource('sales', SaleController::class);

    Route::get('stock-histories', [StockHistoryController::class, 'index']);
    Route::get('stock-histories/{stockHistory}', [StockHistoryController::class, 'show']);

    // Admin-only — user management
    Route::middleware('role:Admin')->group(function () {
        Route::apiResource('users', UserController::class);
    });
});
