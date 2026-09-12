<?php

use App\Http\Controllers\CategoryController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Liveness/health probe. JSON-only so load balancers and monitoring tools can
// hit it without sending an Accept: application/json header.
Route::get('/up', function () {
    try {
        DB::connection()->getPdo();

        return response()->json(['status' => 'up']);
    } catch (Throwable $e) {
        return response()->json(['status' => 'down'], 503);
    }
});

// Category Routes
Route::resource(
    'categories',
    CategoryController::class
);
