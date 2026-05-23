<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\BusinessController;
use App\Http\Controllers\Api\BusinessReferenceItemController;
use App\Http\Controllers\Api\CapitalMovementController;
use App\Http\Controllers\Api\CoffeeSaleController;
use App\Http\Controllers\Api\CompensationRunController;
use App\Http\Controllers\Api\EtherealSaleController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\GcashSaleController;
use App\Http\Controllers\Api\PrintSaleController;
use App\Http\Controllers\Api\SalesReportController;
use App\Http\Controllers\Api\StaffAbsenceController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\StaffDayOffController;
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
      Route::post('capital/movements', [CapitalMovementController::class, 'storeBusiness'])
        ->middleware('role:admin,owner');
      Route::apiResource('staff', StaffController::class)->only(['index', 'store']);
      Route::put('staff/{staff}', [StaffController::class, 'update'])
        ->middleware('portfolio.reauth');
      Route::delete('staff/{staff}', [StaffController::class, 'destroy'])
        ->middleware('portfolio.reauth');
      Route::apiResource('staff_day_offs', StaffDayOffController::class)
        ->parameters(['staff_day_offs' => 'staffDayOff'])
        ->only(['index', 'store']);
      Route::delete('staff_day_offs/{staffDayOff}', [StaffDayOffController::class, 'destroy'])
        ->middleware('portfolio.reauth');
      Route::apiResource('staff_absences', StaffAbsenceController::class)
        ->parameters(['staff_absences' => 'staffAbsence'])
        ->only(['index', 'store']);
      Route::delete('staff_absences/{staffAbsence}', [StaffAbsenceController::class, 'destroy'])
        ->middleware('portfolio.reauth');
      Route::apiResource('compensation_runs', CompensationRunController::class)
        ->parameters(['compensation_runs' => 'compensationRun'])
        ->only(['index', 'store']);
      Route::delete('compensation_runs/{compensationRun}', [CompensationRunController::class, 'destroy'])
        ->middleware('portfolio.reauth');
      Route::post('compensation_runs/{compensationRun}/finalize', [CompensationRunController::class, 'finalize'])
        ->middleware(['role:admin,owner', 'portfolio.reauth']);
      Route::apiResource('expenses', ExpenseController::class)->only(['index', 'store']);
      Route::put('expenses/{expense}', [ExpenseController::class, 'update'])
        ->middleware('portfolio.reauth');
      Route::delete('expenses/{expense}', [ExpenseController::class, 'destroy'])
        ->middleware('portfolio.reauth');
      Route::apiResource('reference_items', BusinessReferenceItemController::class)
        ->parameters(['reference_items' => 'businessReferenceItem'])
        ->only(['index', 'store']);
      Route::put('reference_items/{businessReferenceItem}', [BusinessReferenceItemController::class, 'update'])
        ->middleware('portfolio.reauth');
      Route::delete('reference_items/{businessReferenceItem}', [BusinessReferenceItemController::class, 'destroy'])
        ->middleware('portfolio.reauth');
      Route::apiResource('gcash_sales', GcashSaleController::class)
        ->parameters(['gcash_sales' => 'gcashSale'])
        ->only(['index', 'store']);
      Route::put('gcash_sales/{gcashSale}', [GcashSaleController::class, 'update'])
        ->middleware('portfolio.reauth');
      Route::delete('gcash_sales/{gcashSale}', [GcashSaleController::class, 'destroy'])
        ->middleware('portfolio.reauth');
      Route::apiResource('coffee_sales', CoffeeSaleController::class)
        ->parameters(['coffee_sales' => 'coffeeSale'])
        ->only(['index', 'store']);
      Route::put('coffee_sales/{coffeeSale}', [CoffeeSaleController::class, 'update'])
        ->middleware('portfolio.reauth');
      Route::delete('coffee_sales/{coffeeSale}', [CoffeeSaleController::class, 'destroy'])
        ->middleware('portfolio.reauth');
      Route::apiResource('print_sales', PrintSaleController::class)
        ->parameters(['print_sales' => 'printSale'])
        ->only(['index', 'store']);
      Route::put('print_sales/{printSale}', [PrintSaleController::class, 'update'])
        ->middleware('portfolio.reauth');
      Route::delete('print_sales/{printSale}', [PrintSaleController::class, 'destroy'])
        ->middleware('portfolio.reauth');
      Route::apiResource('ethereal_sales', EtherealSaleController::class)
        ->parameters(['ethereal_sales' => 'etherealSale'])
        ->only(['index', 'store']);
      Route::put('ethereal_sales/{etherealSale}', [EtherealSaleController::class, 'update'])
        ->middleware('portfolio.reauth');
      Route::delete('ethereal_sales/{etherealSale}', [EtherealSaleController::class, 'destroy'])
        ->middleware('portfolio.reauth');
      Route::apiResource('sales_reports', SalesReportController::class)
        ->middleware('role:admin,owner')
        ->only(['index', 'store']);
      Route::get('sales_reports/{salesReportVersion}/download', [SalesReportController::class, 'download'])
        ->name('sales-reports.download')
        ->middleware('role:admin,owner');
    });

  Route::post('portfolio_capital/movements', [CapitalMovementController::class, 'storePortfolio'])
    ->middleware(['role:admin,owner', 'portfolio.reauth']);

  Route::get('portfolio/sales_reports', [SalesReportController::class, 'indexPortfolio'])
    ->middleware('role:admin,owner');
  Route::get('portfolio/sales_reports/{salesReportVersion}/download', [SalesReportController::class, 'downloadPortfolio'])
    ->name('portfolio-sales-reports.download')
    ->middleware('role:admin,owner');

  Route::post('sales_reports/generate', [SalesReportController::class, 'generate']);

  Route::get('capital/movements', [CapitalMovementController::class, 'index']);
});
