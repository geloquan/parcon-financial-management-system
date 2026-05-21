<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compensation_runs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignId('computed_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('computation_mode', ['by_days', 'up_to_date']);
            $table->unsignedInteger('number_of_days')->nullable();
            $table->date('cutoff_date');
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('gross_pay', 14, 2);
            $table->decimal('total_deductions', 14, 2);
            $table->decimal('net_pay', 14, 2);
            $table->json('employee_breakdown');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compensation_runs');
    }
};
