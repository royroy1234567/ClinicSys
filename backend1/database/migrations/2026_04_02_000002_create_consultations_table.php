<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultations', function (Blueprint $table) {
            $table->id('consultation_id');
            $table->unsignedBigInteger('queue_entry_id')->unique();
            $table->unsignedBigInteger('patient_id');
            $table->unsignedBigInteger('doctor_id');
            $table->longText('chief_complaint')->nullable();
            $table->string('blood_pressure', 50)->nullable();
            $table->string('temperature', 50)->nullable();
            $table->string('heart_rate', 50)->nullable();
            $table->string('weight', 50)->nullable();
            $table->longText('diagnosis')->nullable();
            $table->longText('notes')->nullable();
            $table->json('treatment_items')->nullable();
            $table->json('lab_requests')->nullable();
            $table->boolean('follow_up_required')->default(false);
            $table->date('follow_up_date')->nullable();
            $table->longText('follow_up_notes')->nullable();
            $table->enum('status', ['draft', 'ongoing', 'completed', 'cancelled'])->default('draft');
            $table->timestamp('session_started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('queue_entry_id')->references('queue_entry_id')->on('queue_entries')->cascadeOnDelete();
            $table->foreign('patient_id')->references('id')->on('patients')->cascadeOnDelete();
            $table->foreign('doctor_id')->references('user_id')->on('clinic_users')->cascadeOnDelete();
            $table->index(['doctor_id', 'created_at']);
            $table->index(['patient_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};
