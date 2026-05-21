<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_report_versions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignId('generated_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->date('start_date');
            $table->date('end_date');
            $table->string('document_title', 255);
            $table->string('document_format', 50)->default('pdf-8.5x13');
            $table->json('metadata');
            $table->json('details');
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['business_id', 'version']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_report_versions');
    }
};
