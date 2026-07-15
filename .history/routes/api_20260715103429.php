<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\CategoryController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\SupplierController;
use App\Http\Controllers\CategoryController as ControllersCategoryController;
use App\Http\Controllers\SupplierController as ControllersSupplierController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


Route::apiResource('categories', ControllersCategoryController::class);
Route::apiResource('suppliers', ControllersSupplierController::class);
