<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table): void {
            $table->dropColumn('payment_type');
            $table->string('proof_path')->nullable()->after('recurrence_reference');
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table): void {
            $table->enum('payment_type', ['one_time', 'repeat'])->default('one_time')->after('purpose');
            $table->dropColumn('proof_path');
        });
    }
};
