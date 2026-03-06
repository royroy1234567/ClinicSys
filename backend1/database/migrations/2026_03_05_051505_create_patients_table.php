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
        Schema::create('patients', function (Blueprint $table) {
            $table->id();

            // Personal Information
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->date('dob');
            $table->integer('age');
            $table->string('gender');
            $table->string('civil_status')->nullable();
            $table->string('nationality')->nullable();

            // Contact Information
            $table->string('mobile');
            $table->string('email')->unique();
            $table->string('google_id')->nullable(); 
            $table->string('street');
            $table->string('city');
            $table->string('province');

            // Account Credentials
            $table->string('password');

            // Medical Information
            $table->string('blood_type')->nullable();
            $table->text('allergies')->nullable();
            $table->text('conditions')->nullable();
            $table->text('medications')->nullable();

            // Emergency Contact
            $table->string('emergency_name');
            $table->string('emergency_relationship');
            $table->string('emergency_contact');

            // Consent
            $table->boolean('agree_privacy')->default(false);
            $table->boolean('agree_storage')->default(false);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};