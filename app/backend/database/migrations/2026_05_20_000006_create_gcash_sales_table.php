<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gcash_sales', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('transaction_recipient');
            $table->decimal('amount_moved', 12, 2);
            $table->decimal('sales_amount', 12, 2);
            $table->decimal('profit_amount', 12, 2);
            $table->enum('transaction_type', ['cash_in', 'cash_out']);
            $table->date('transaction_date');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gcash_sales');
    }
};
