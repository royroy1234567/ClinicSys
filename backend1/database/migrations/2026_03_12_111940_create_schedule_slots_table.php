<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedule_slots', function (Blueprint $table) {
            $table->id('slot_id');
            $table->foreignId('schedule_id')->constrained('doctor_schedules', 'schedule_id')->onDelete('cascade');
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('duration')->default(30); // in minutes
            $table->integer('max_patients')->default(0);
            $table->integer('booked')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedule_slots');
    }
};