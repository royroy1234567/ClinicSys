<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('transaction_number', 32)->unique()->nullable()->after('transaction_id');
            $table->unsignedBigInteger('queue_entry_id')->nullable()->after('patient_id');
            $table->foreign('queue_entry_id')->references('queue_entry_id')->on('queue_entries')->nullOnDelete();
            $table->index('queue_entry_id');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['queue_entry_id']);
            $table->dropIndex(['queue_entry_id']);
            $table->dropColumn(['transaction_number', 'queue_entry_id']);
        });
    }
};
