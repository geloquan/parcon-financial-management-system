<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // GCash: charged_amount = sales_amount for non-debt rows that are still NULL
        DB::statement(
            'UPDATE gcash_sales SET charged_amount = sales_amount WHERE is_debt = 0 AND charged_amount IS NULL'
        );

        // Coffee: charged_amount = price + add_on_price for non-debt rows that are still NULL
        DB::statement(
            'UPDATE coffee_sales SET charged_amount = price + add_on_price WHERE is_debt = 0 AND charged_amount IS NULL'
        );

        // Print: charged_amount = sales_amount for non-debt rows that are still NULL
        DB::statement(
            'UPDATE print_sales SET charged_amount = sales_amount WHERE is_debt = 0 AND charged_amount IS NULL'
        );

        // Ethereal: charged_amount = net_amount for non-debt rows that are still NULL
        DB::statement(
            'UPDATE ethereal_sales SET charged_amount = net_amount WHERE is_debt = 0 AND charged_amount IS NULL'
        );
    }

    public function down(): void
    {
        // Not reversible without knowing which rows were originally null.
    }
};
