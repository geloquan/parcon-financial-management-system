<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\BusinessController;
use App\Http\Controllers\Api\CapitalMovementController;
use App\Http\Controllers\Api\CoffeeSaleController;
use App\Http\Controllers\Api\EtherealSaleController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\GcashSaleController;
use App\Http\Controllers\Api\PrintSaleController;
use App\Http\Controllers\Api\StaffController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth.api')->group(function (): void {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('auth.api')->group(function (): void {
    Route::apiResource('businesses', BusinessController::class);

    Route::prefix('businesses/{business}')
        ->middleware('business.access')
        ->group(function (): void {
            Route::apiResource('staff', StaffController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::apiResource('expenses', ExpenseController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::apiResource('gcash_sales', GcashSaleController::class)
                ->parameters(['gcash_sales' => 'gcashSale'])
                ->only(['index', 'store', 'update', 'destroy']);
            Route::apiResource('coffee_sales', CoffeeSaleController::class)
                ->parameters(['coffee_sales' => 'coffeeSale'])
                ->only(['index', 'store', 'update', 'destroy']);
            Route::apiResource('print_sales', PrintSaleController::class)
                ->parameters(['print_sales' => 'printSale'])
                ->only(['index', 'store', 'update', 'destroy']);
            Route::apiResource('ethereal_sales', EtherealSaleController::class)
                ->parameters(['ethereal_sales' => 'etherealSale'])
                ->only(['index', 'store', 'update', 'destroy']);
        });

    Route::post('portfolio_capital/movements', [CapitalMovementController::class, 'storePortfolio'])
        ->middleware(['role:admin,owner', 'portfolio.reauth']);

    Route::get('capital/movements', [CapitalMovementController::class, 'index']);
});
