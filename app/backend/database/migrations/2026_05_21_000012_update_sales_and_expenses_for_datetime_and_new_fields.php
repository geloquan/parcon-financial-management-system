<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table): void {
            $table->dateTime('date_issued')->change();
        });

        Schema::table('gcash_sales', function (Blueprint $table): void {
            $table->string('transaction_recipient')->nullable()->change();
            $table->dateTime('transaction_date')->change();
        });

        Schema::table('coffee_sales', function (Blueprint $table): void {
            $table->dateTime('sale_date')->change();
            $table->decimal('add_on_price', 12, 2)->default(0);
            $table->string('add_on_description', 500)->nullable();
        });

        Schema::table('print_sales', function (Blueprint $table): void {
            $table->dateTime('sale_date')->change();
            $table->enum('color_mode', ['black', 'white'])->default('black');
            $table->string('print_size', 100)->default('short');
            $table->unsignedInteger('paper_count')->default(1);
        });

        Schema::table('ethereal_sales', function (Blueprint $table): void {
            $table->dateTime('service_date')->change();
            $table->string('customer_name')->nullable();
            $table->string('discount_type', 100)->default('promo');
        });
    }

    public function down(): void
    {
        Schema::table('ethereal_sales', function (Blueprint $table): void {
            $table->date('service_date')->change();
            $table->dropColumn(['customer_name', 'discount_type']);
        });

        Schema::table('print_sales', function (Blueprint $table): void {
            $table->date('sale_date')->change();
            $table->dropColumn(['color_mode', 'print_size', 'paper_count']);
        });

        Schema::table('coffee_sales', function (Blueprint $table): void {
            $table->date('sale_date')->change();
            $table->dropColumn(['add_on_price', 'add_on_description']);
        });

        Schema::table('gcash_sales', function (Blueprint $table): void {
            $table->string('transaction_recipient')->nullable(false)->change();
            $table->date('transaction_date')->change();
        });

        Schema::table('expenses', function (Blueprint $table): void {
            $table->date('date_issued')->change();
        });
    }
};
