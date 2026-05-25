<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gcash_sales', function (Blueprint $table): void {
            $table->boolean('is_debt')->default(false)->after('profit_amount');
            $table->decimal('charged_amount', 12, 2)->nullable()->after('is_debt');
            $table->text('remarks')->nullable()->after('charged_amount');
        });

        Schema::table('coffee_sales', function (Blueprint $table): void {
            $table->boolean('is_debt')->default(false)->after('add_on_description');
            $table->decimal('charged_amount', 12, 2)->nullable()->after('is_debt');
            $table->text('remarks')->nullable()->after('charged_amount');
        });

        Schema::table('print_sales', function (Blueprint $table): void {
            $table->boolean('is_debt')->default(false)->after('sales_amount');
            $table->decimal('charged_amount', 12, 2)->nullable()->after('is_debt');
            $table->text('remarks')->nullable()->after('charged_amount');
        });

        Schema::table('ethereal_sales', function (Blueprint $table): void {
            $table->boolean('is_debt')->default(false)->after('net_amount');
            $table->decimal('charged_amount', 12, 2)->nullable()->after('is_debt');
            $table->text('remarks')->nullable()->after('charged_amount');
        });
    }

    public function down(): void
    {
        Schema::table('ethereal_sales', function (Blueprint $table): void {
            $table->dropColumn(['is_debt', 'charged_amount', 'remarks']);
        });

        Schema::table('print_sales', function (Blueprint $table): void {
            $table->dropColumn(['is_debt', 'charged_amount', 'remarks']);
        });

        Schema::table('coffee_sales', function (Blueprint $table): void {
            $table->dropColumn(['is_debt', 'charged_amount', 'remarks']);
        });

        Schema::table('gcash_sales', function (Blueprint $table): void {
            $table->dropColumn(['is_debt', 'charged_amount', 'remarks']);
        });
    }
};
