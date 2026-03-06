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
            Schema::create('clinic_users', function (Blueprint $table) {
                $table->id('user_id');
                $table->string('first_name', 50);
                $table->string('last_name', 50);
                $table->enum('role', ['Manager', 'Admin', 'Doctor', 'Staff']);
                $table->string('specialization', 100)->nullable();
                $table->string('license_number', 50)->nullable();
                $table->string('contact_number', 20)->nullable();
                $table->string('email', 100)->unique();
                $table->string('username', 50)->unique();
                $table->string('password', 255);
                $table->string('status', 20)->default('Active');
                $table->timestamp('created_at')->useCurrent();
            });
        }

        /**
         * Reverse the migrations.
         */
        public function down(): void
        {
            Schema::dropIfExists('clinic_users');
        }
    };