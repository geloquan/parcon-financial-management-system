<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_report_versions', function (Blueprint $table): void {
            $table->string('report_type', 30)->default('sales')->after('document_format');
        });

        DB::table('sales_report_versions')
            ->whereNull('report_type')
            ->update(['report_type' => 'sales']);
    }

    public function down(): void
    {
        Schema::table('sales_report_versions', function (Blueprint $table): void {
            $table->dropColumn('report_type');
        });
    }
};
