<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::table('gcash_sales', function (Blueprint $table): void {
      $table->string('reference_item_name')->nullable()->after('transaction_recipient');
      $table->decimal('reference_item_original_price', 12, 2)->nullable()->after('reference_item_name');
    });

    Schema::table('coffee_sales', function (Blueprint $table): void {
      $table->string('reference_item_name')->nullable()->after('coffee_type');
      $table->decimal('reference_item_original_price', 12, 2)->nullable()->after('reference_item_name');
    });

    Schema::table('print_sales', function (Blueprint $table): void {
      $table->string('reference_item_name')->nullable()->after('description');
      $table->decimal('reference_item_original_price', 12, 2)->nullable()->after('reference_item_name');
    });

    Schema::table('ethereal_sales', function (Blueprint $table): void {
      $table->string('service_name')->nullable()->after('staff_ids');
      $table->string('reference_item_name')->nullable()->after('service_name');
      $table->decimal('reference_item_original_price', 12, 2)->nullable()->after('reference_item_name');
    });

    Schema::table('sales_report_versions', function (Blueprint $table): void {
      $table->string('file_path')->nullable()->after('document_format');
      $table->unsignedBigInteger('file_size_bytes')->nullable()->after('file_path');
    });
  }

  public function down(): void
  {
    Schema::table('sales_report_versions', function (Blueprint $table): void {
      $table->dropColumn(['file_path', 'file_size_bytes']);
    });

    Schema::table('ethereal_sales', function (Blueprint $table): void {
      $table->dropColumn(['service_name', 'reference_item_name', 'reference_item_original_price']);
    });

    Schema::table('print_sales', function (Blueprint $table): void {
      $table->dropColumn(['reference_item_name', 'reference_item_original_price']);
    });

    Schema::table('coffee_sales', function (Blueprint $table): void {
      $table->dropColumn(['reference_item_name', 'reference_item_original_price']);
    });

    Schema::table('gcash_sales', function (Blueprint $table): void {
      $table->dropColumn(['reference_item_name', 'reference_item_original_price']);
    });
  }
};
