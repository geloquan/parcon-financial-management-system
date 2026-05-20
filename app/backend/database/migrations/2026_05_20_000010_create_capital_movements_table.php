<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('capital_movements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('initiated_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->enum('direction', ['add', 'deduct', 'transfer']);
            $table->enum('source_type', ['portfolio', 'business']);
            $table->foreignId('source_business_id')->nullable()->constrained('businesses')->nullOnDelete();
            $table->foreignId('target_business_id')->nullable()->constrained('businesses')->nullOnDelete();
            $table->date('occurred_on');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('capital_movements');
    }
};
