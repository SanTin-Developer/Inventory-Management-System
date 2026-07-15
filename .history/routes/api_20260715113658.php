<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController as ControllersCategoryController;
use App\Http\Controllers\ProductController as ControllersProductController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\StockHistoryController;
use App\Http\Controllers\SupplierController as ControllersSupplierController;
use App\Http\Controllers\UserController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::apiResource('categories', ControllersCategoryController::class);
Route::apiResource('suppliers', ControllersSupplierController::class);
Route::apiResource('products', ControllersProductController::class);
Route::apiResource('purchases', PurchaseController::class);
Route::apiResource('sales', SaleController::class);
Route::apiResource('users', UserController::class);
Route::get('stock-histories', [StockHistoryController::class, 'index']);
Route::get('stock-histories/{stockHistory}', [StockHistoryController::class, 'show']);
