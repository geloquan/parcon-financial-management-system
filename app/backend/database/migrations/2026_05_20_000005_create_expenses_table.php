<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->date('date_issued');
            $table->decimal('amount', 12, 2);
            $table->string('description', 500);
            $table->enum('purpose', ['business', 'business_portfolio', 'service']);
            $table->enum('payment_type', ['one_time', 'repeat']);
            $table->string('recurrence_reference')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
