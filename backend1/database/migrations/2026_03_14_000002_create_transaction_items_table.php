<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transaction_items', function (Blueprint $table) {
            $table->id('item_id');
            $table->unsignedBigInteger('transaction_id');
            $table->unsignedBigInteger('service_id');
            $table->string('service_name', 100);   // snapshot at time of sale
            $table->decimal('unit_price', 10, 2);  // snapshot at time of sale
            $table->integer('quantity')->default(1);
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();

            $table->foreign('transaction_id')->references('transaction_id')->on('transactions')->cascadeOnDelete();
            $table->foreign('service_id')->references('service_id')->on('services')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_items');
    }
};
