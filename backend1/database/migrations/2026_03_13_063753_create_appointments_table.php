<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id('appointment_id');
            $table->unsignedBigInteger('patient_id');
            $table->foreign('patient_id')->references('id')->on('patients')->cascadeOnDelete();
            $table->unsignedBigInteger('doctor_id')->nullable();
            $table->foreign('doctor_id')->references('user_id')->on('clinic_users')->nullOnDelete();
            $table->unsignedBigInteger('service_id')->nullable();
            $table->foreign('service_id')->references('service_id')->on('services')->nullOnDelete();
            $table->date('appointment_date');
            $table->time('appointment_time');
            $table->string('reason', 500)->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['scheduled','completed','cancelled','no_show'])->default('scheduled');
            $table->timestamps();

            $table->index(['doctor_id', 'appointment_date']);
            $table->index(['patient_id', 'appointment_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};