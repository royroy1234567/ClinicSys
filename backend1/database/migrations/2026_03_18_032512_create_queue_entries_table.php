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
        Schema::create('queue_entries', function (Blueprint $table) {
            $table->id("queue_entry_id");
            $table->unsignedBigInteger('appointment_id')->nullable()->unique();
            $table->unsignedBigInteger('patient_id');
            $table->unsignedBigInteger('doctor_id')->nullable( );
            $table->date('queue_date');
            $table->unsignedInteger('queue_number');
            $table->enum('source', ['appointment', 'walk-in']);
            $table->enum('priority', ['senior', 'appointment', 'walkin'])->default('walkin'); 
            $table->enum('status', ['waiting', 'called', 'ongoing', 'completed', 'no-show'])->default('waiting');
            $table->time('arrival_time')->nullable();
            $table->timestamp('called_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('appointment_id')->references('appointment_id')->on('appointments')->nullonDelete('');
            $table->foreign('patient_id')->references('id')->on('patients')->cascadeonDelete('');
            $table->foreign('doctor_id')->references('user_id')->on('clinic_users')->nullOnDelete('');
            $table->index(['queue_date', 'queue_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('queue_entries');
    }
};