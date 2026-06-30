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
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->string('prescription_number')->nullable()->unique()->after('id');
            $table->string('status')->default('Pending')->after('doctor_id');
            $table->text('notes')->nullable()->after('instructions');
            $table->foreignId('dispensed_by')->nullable()->after('notes')->constrained('users')->nullOnDelete();
            $table->timestamp('dispensed_at')->nullable()->after('dispensed_by');

            $table->index(['status', 'created_at']);
            $table->index(['doctor_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at']);
            $table->dropIndex(['doctor_id', 'created_at']);
            $table->dropConstrainedForeignId('dispensed_by');
            $table->dropUnique(['prescription_number']);
            $table->dropColumn(['prescription_number', 'status', 'notes', 'dispensed_at']);
        });
    }
};
