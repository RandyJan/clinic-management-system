<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('laboratory_requests', function (Blueprint $table) {
            $table->longText('result')->nullable()->after('status');
            $table->text('result_notes')->nullable()->after('result');
            $table->timestamp('resulted_at')->nullable()->after('result_notes')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('laboratory_requests', function (Blueprint $table) {
            $table->dropIndex(['resulted_at']);
            $table->dropColumn(['result', 'result_notes', 'resulted_at']);
        });
    }
};
