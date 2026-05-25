<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

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
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE capital_movements DROP CONSTRAINT IF EXISTS capital_movements_direction_check');
            DB::statement("ALTER TABLE capital_movements ADD CONSTRAINT capital_movements_direction_check CHECK (direction IN ('add', 'deduct', 'transfer', 'debt'))");
        } elseif ($driver === 'mysql') {
            DB::statement(
                "ALTER TABLE capital_movements MODIFY direction ENUM('add','deduct','transfer','debt') NOT NULL"
            );
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE capital_movements DROP CONSTRAINT IF EXISTS capital_movements_direction_check');
            DB::statement("ALTER TABLE capital_movements ADD CONSTRAINT capital_movements_direction_check CHECK (direction IN ('add', 'deduct', 'transfer'))");
        } elseif ($driver === 'mysql') {
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
