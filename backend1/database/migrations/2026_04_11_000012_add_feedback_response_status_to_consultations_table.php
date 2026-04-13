<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->enum('feedback_response_status', ['pending', 'responded'])
                ->default('pending')
                ->after('session_rated_at');
            $table->timestamp('feedback_responded_at')->nullable()->after('feedback_response_status');
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->dropColumn(['feedback_response_status', 'feedback_responded_at']);
        });
    }
};
