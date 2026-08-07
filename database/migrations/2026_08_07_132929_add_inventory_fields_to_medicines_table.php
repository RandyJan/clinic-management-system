<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->string('medicine_code')->nullable()->unique()->after('id');
            $table->string('generic_name')->nullable()->after('name');
            $table->string('brand_name')->nullable()->after('generic_name');
            $table->string('category')->nullable()->after('brand_name');
            $table->string('dosage_form')->nullable()->after('category');
            $table->string('strength')->nullable()->after('dosage_form');
            $table->unsignedInteger('current_stock')->default(0)->after('unit');
            $table->unsignedInteger('reorder_level')->default(0)->after('current_stock');
            $table->date('expiry_date')->nullable()->after('reorder_level');
            $table->decimal('selling_price', 12, 2)->default(0)->after('expiry_date');
            $table->decimal('cost_price', 12, 2)->default(0)->after('selling_price');
            $table->string('status')->default('active')->after('cost_price');

            $table->index(['status', 'category']);
            $table->index(['current_stock', 'reorder_level']);
            $table->index('expiry_date');
        });

        DB::table('medicines')->update([
            'medicine_code' => DB::raw('sku'),
            'current_stock' => DB::raw('stock_quantity'),
            'status' => DB::raw("CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END"),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->dropIndex(['status', 'category']);
            $table->dropIndex(['current_stock', 'reorder_level']);
            $table->dropIndex(['expiry_date']);
            $table->dropColumn([
                'medicine_code',
                'generic_name',
                'brand_name',
                'category',
                'dosage_form',
                'strength',
                'current_stock',
                'reorder_level',
                'expiry_date',
                'selling_price',
                'cost_price',
                'status',
            ]);
        });
    }
};
