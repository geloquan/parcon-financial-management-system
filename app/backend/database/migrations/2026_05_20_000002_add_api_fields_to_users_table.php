<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('username')->nullable()->after('name');
            $table->string('role')->default('owner')->after('password');
            $table->foreignId('business_id')->nullable()->constrained('businesses')->nullOnDelete();
            $table->text('api_token')->nullable();
            $table->softDeletes();
        });

        DB::table('users')->whereNull('username')->update([
            'username' => DB::raw('email'),
        ]);

        Schema::table('users', function (Blueprint $table): void {
            $table->unique('username');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique(['username']);
            $table->dropConstrainedForeignId('business_id');
            $table->dropColumn(['username', 'role', 'api_token', 'deleted_at']);
        });
    }
};
