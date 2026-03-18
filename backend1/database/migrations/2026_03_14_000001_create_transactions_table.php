<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id('transaction_id');
            $table->unsignedBigInteger('patient_id')->nullable(); // nullable for walk-ins
            $table->unsignedBigInteger('staff_id');               // FK → clinic_users.user_id
            $table->decimal('subtotal',  10, 2)->default(0);
            $table->decimal('discount',  10, 2)->default(0);
            $table->decimal('total',     10, 2)->default(0);
            $table->string('payment_method', 30)->default('cash'); // cash|card|gcash|maya
            $table->decimal('amount_tendered', 10, 2)->nullable(); // cash only
            $table->decimal('change_amount',   10, 2)->nullable(); // cash only
            $table->string('status', 20)->default('paid');         // paid|cancelled
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('patient_id')->references('id')->on('patients')->nullOnDelete();
            $table->foreign('staff_id')->references('user_id')->on('clinic_users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
