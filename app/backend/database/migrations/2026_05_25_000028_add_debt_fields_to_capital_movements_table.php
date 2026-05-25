<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('capital_movements', function (Blueprint $table): void {
            $table->text('remarks')->nullable()->after('notes');
            $table->string('debt_status', 20)->nullable()->after('remarks');
            $table->timestamp('settled_at')->nullable()->after('debt_status');
            $table->foreignId('settled_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->after('settled_at');
        });

        // Extend the direction enum to include 'debt'.
        // SQLite (used in tests) ignores enum constraints, so this only affects MySQL/Postgres.
        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE capital_movements MODIFY direction ENUM('add','deduct','transfer','debt') NOT NULL"
            );
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement(
                "ALTER TABLE capital_movements MODIFY direction ENUM('add','deduct','transfer') NOT NULL"
            );
        }

        Schema::table('capital_movements', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('settled_by_user_id');
            $table->dropColumn(['remarks', 'debt_status', 'settled_at']);
        });
    }
};
