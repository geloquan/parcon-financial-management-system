<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('compensation_runs', function (Blueprint $table): void {
            $table->enum('payment_status', ['pending', 'finalized'])->default('pending')->after('employee_breakdown');
            $table->foreignId('finalized_by_user_id')->nullable()->after('payment_status')->constrained('users')->nullOnDelete();
            $table->dateTime('finalized_at')->nullable()->after('finalized_by_user_id');
            $table->json('payment_history')->nullable()->after('finalized_at');
        });
    }

    public function down(): void
    {
        Schema::table('compensation_runs', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('finalized_by_user_id');
            $table->dropColumn(['payment_status', 'finalized_at', 'payment_history']);
        });
    }
};
