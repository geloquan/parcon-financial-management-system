<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
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

    $driver = DB::getDriverName();

    if ($driver === 'mysql') {
      DB::statement(
        "ALTER TABLE capital_movements MODIFY direction ENUM('add','deduct','transfer','debt') NOT NULL"
      );
    } elseif ($driver === 'pgsql') {
      DB::statement('ALTER TABLE capital_movements DROP CONSTRAINT capital_movements_direction_check');
      DB::statement(
        "ALTER TABLE capital_movements ADD CONSTRAINT capital_movements_direction_check
                    CHECK (direction IN ('add','deduct','transfer','debt'))"
      );
    }
  }

  public function down(): void
  {
    $driver = DB::getDriverName();

    if ($driver === 'mysql') {
      DB::statement(
        "ALTER TABLE capital_movements MODIFY direction ENUM('add','deduct','transfer') NOT NULL"
      );
    } elseif ($driver === 'pgsql') {
      DB::statement('ALTER TABLE capital_movements DROP CONSTRAINT capital_movements_direction_check');
      DB::statement(
        "ALTER TABLE capital_movements ADD CONSTRAINT capital_movements_direction_check
                    CHECK (direction IN ('add','deduct','transfer'))"
      );
    }


    Schema::table('capital_movements', function (Blueprint $table): void {
      $table->dropConstrainedForeignId('settled_by_user_id');
      $table->dropColumn(['remarks', 'debt_status', 'settled_at']);
    });
  }
};
