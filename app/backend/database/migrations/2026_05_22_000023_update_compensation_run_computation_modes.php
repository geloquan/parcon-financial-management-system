<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        DB::table('compensation_runs')
            ->whereIn('computation_mode', ['by_days', 'up_to_date'])
            ->update(['computation_mode' => 'specific_date']);

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE compensation_runs DROP CONSTRAINT IF EXISTS compensation_runs_computation_mode_check');
            DB::statement("ALTER TABLE compensation_runs ADD CONSTRAINT compensation_runs_computation_mode_check CHECK (computation_mode IN ('today', 'specific_date'))");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE compensation_runs MODIFY computation_mode ENUM('today', 'specific_date') NOT NULL");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        DB::table('compensation_runs')
            ->whereIn('computation_mode', ['today', 'specific_date'])
            ->update(['computation_mode' => 'up_to_date']);

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE compensation_runs DROP CONSTRAINT IF EXISTS compensation_runs_computation_mode_check');
            DB::statement("ALTER TABLE compensation_runs ADD CONSTRAINT compensation_runs_computation_mode_check CHECK (computation_mode IN ('by_days', 'up_to_date'))");
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE compensation_runs MODIFY computation_mode ENUM('by_days', 'up_to_date') NOT NULL");
        }
    }
};
