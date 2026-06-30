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
            $table->string('lab_request_number')->nullable()->unique()->after('id');
            $table->json('requested_tests')->nullable()->after('doctor_id');
            $table->text('clinical_notes')->nullable()->after('requested_tests');
            $table->timestamp('requested_at')->nullable()->after('status');
            $table->timestamp('completed_at')->nullable()->after('requested_at');
            $table->string('status')->default('Pending')->change();

            $table->index(['status', 'requested_at']);
            $table->index(['doctor_id', 'requested_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('laboratory_requests', function (Blueprint $table) {
            $table->dropIndex(['status', 'requested_at']);
            $table->dropIndex(['doctor_id', 'requested_at']);
            $table->dropUnique(['lab_request_number']);
            $table->dropColumn(['lab_request_number', 'requested_tests', 'clinical_notes', 'requested_at', 'completed_at']);
            $table->string('status')->default('Requested')->change();
        });
    }
};
