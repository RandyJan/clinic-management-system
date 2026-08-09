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
        Schema::create('clinic_settings', function (Blueprint $table) {
            $table->id();
            $table->string('clinic_name')->default('Clinic Management System');
            $table->text('clinic_address')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('email')->nullable();
            $table->string('logo_path')->nullable();
            $table->decimal('consultation_default_fee', 10, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->unsignedSmallInteger('appointment_slot_duration')->default(30);
            $table->time('opening_time')->nullable();
            $table->time('closing_time')->nullable();
            $table->text('receipt_footer')->nullable();
            $table->text('certificate_footer')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinic_settings');
    }
};
