<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ethereal_sales', function (Blueprint $table): void {
            $table->json('staff_ids')->nullable()->after('staff_id');
        });
    }

    public function down(): void
    {
        Schema::table('ethereal_sales', function (Blueprint $table): void {
            $table->dropColumn('staff_ids');
        });
    }
};
