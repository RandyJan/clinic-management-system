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
        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('doctor_code')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('specialization');
            $table->string('license_number')->unique();
            $table->string('contact_number')->nullable();
            $table->string('email')->nullable();
            $table->decimal('consultation_fee', 10, 2);
            $table->text('schedule');
            $table->string('status')->default('active');
            $table->timestamps();

            $table->index(['last_name', 'first_name']);
            $table->index(['specialization', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('doctors');
    }
};
