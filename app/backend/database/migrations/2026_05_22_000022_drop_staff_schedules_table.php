<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('staff_schedules');
    }

    public function down(): void
    {
        Schema::create('staff_schedules', function (\Illuminate\Database\Schema\Blueprint $table): void {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('staff')->cascadeOnDelete();
            $table->date('scheduled_on');
            $table->enum('attendance_status', ['pending', 'present', 'absent'])->default('pending');
            $table->dateTime('attendance_marked_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['staff_id', 'scheduled_on']);
        });
    }
};
