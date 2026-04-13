<?php

use App\Http\Controllers\PatientsController;
use App\Http\Controllers\ClinicUsersController;
use App\Http\Controllers\ServicsController;
use App\Http\Controllers\GoogleController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DoctorScheduleController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\ConsultationController;
use App\Http\Controllers\QueueEntriesController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\ClinicSettingController;
use App\Http\Controllers\ManagerAnalyticsController;
use App\Http\Controllers\AdminSystemController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/test', function () {
    return response()->json(['status' => 'api working']);
});

// Auth
Route::post('/auth/login',  [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout']);
Route::post('/auth/forgot-password/send-otp', [AuthController::class, 'sendForgotPasswordOtp']);
Route::post('/auth/forgot-password/verify-otp', [AuthController::class, 'verifyForgotPasswordOtp']);
Route::post('/auth/forgot-password/reset', [AuthController::class, 'resetForgotPassword']);

// Google OAuth
Route::get('/auth/google',          [GoogleController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [GoogleController::class, 'handleGoogleCallback']);

// Patient public routes
Route::post('/patients/register',    [PatientsController::class, 'register']);
Route::post('/patients/check-email', [PatientsController::class, 'checkEmail']);
Route::post('/patients/send-verification-code', [PatientsController::class, 'sendEmailVerificationCode']);
Route::post('/patients/verify-verification-code', [PatientsController::class, 'verifyEmailVerificationCode']);
Route::get('/clinic-settings', [ClinicSettingController::class, 'index']);
Route::get('/landing-stats', [ManagerAnalyticsController::class, 'landingStats']);

/*
|--------------------------------------------------------------------------
| Protected Routes (auth:sanctum)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // Authenticated user info
    Route::get('/user', fn(Request $r) => $r->user());

    // Password gate (shared — used by Manage User modal AND View Patient modal)
    Route::post('/auth/verify-password', [AuthController::class, 'verifyPassword']);
    Route::get('/auth/me', [AuthController::class, 'me']); // ← dagdag
    Route::post('clinic-settings', [ClinicSettingController::class, 'update']); 

    // Clinic Users
    Route::apiResource('users', ClinicUsersController::class);
    Route::patch('users/{id}/toggle-status', [ClinicUsersController::class, 'toggleStatus']);
    Route::get('users/{id}/availability', [ClinicUsersController::class, 'getAvailability']);
    Route::patch('users/{id}/availability', [ClinicUsersController::class, 'updateAvailability']);

    // Services
    Route::apiResource('servics', ServicsController::class);
    Route::patch('servics/{service}/toggle-status', [ServicsController::class, 'toggleStatus']);

    // Patients
    Route::get('/patients',                          [PatientsController::class, 'index']);
    Route::get('/patients/medical-history',          [PatientsController::class, 'medicalHistoryIndex']);
    Route::patch('/patients/{id}/toggle-status',     [PatientsController::class, 'toggleStatus']);  // ← new
    Route::get('/patient/profile',                   [PatientsController::class, 'profile']);
    Route::put('/patient/profile',                   [PatientsController::class, 'updateProfile']);
    Route::put('/patient/password',                  [PatientsController::class, 'updatePassword']);

    // Doctor Schedules
    Route::prefix('doctor-schedules')->group(function () {
        Route::get('/',                   [DoctorScheduleController::class, 'index']);
        Route::post('/',                  [DoctorScheduleController::class, 'store']);
        Route::get('/{userId}/{date}',    [DoctorScheduleController::class, 'show']);
        Route::delete('/{userId}/{date}', [DoctorScheduleController::class, 'destroy']);
    });

    // Appointments (removed duplicate middleware — already inside auth:sanctum group)
    Route::prefix('appointments')->group(function () {
        Route::get('/',        [AppointmentController::class, 'index']);
        Route::post('/',       [AppointmentController::class, 'store']);
        Route::delete('/{id}', [AppointmentController::class, 'destroy']);
        Route::patch('/{id}/reschedule', [AppointmentController::class, 'reschedule']);
    });

    Route::prefix('queue-entries')->group(function () {
        Route::get('/', [QueueEntriesController::class, 'index']);
        Route::post('/walkin', [QueueEntriesController::class, 'storeWalkin']);
        Route::patch('/{id}/status', [QueueEntriesController::class, 'updateStatus']);
        Route::patch('/{id}/assign-doctor', [QueueEntriesController::class, 'assignDoctor']);
    });
    Route::post('/appointments/{id}/check-in', [QueueEntriesController::class, 'checkInAppointment']);
    Route::get('/consultations', [ConsultationController::class, 'index']);
    Route::get('/consultations/queue-entry/{queueEntryId}', [ConsultationController::class, 'byQueueEntry']);
    Route::put('/consultations/queue-entry/{queueEntryId}', [ConsultationController::class, 'upsertByQueueEntry']);
    Route::post('/consultations/{consultationId}/rate', [ConsultationController::class, 'rate']);
    Route::post('/consultations/{consultationId}/respond-feedback', [ConsultationController::class, 'respondToFeedback']);

    // Transactions (POS)
    Route::prefix('transactions')->group(function () {
        Route::get('/pending-payments', [TransactionController::class, 'pendingPayments']);
        Route::get('/',        [TransactionController::class, 'index']);
        Route::post('/',       [TransactionController::class, 'store']);
        Route::get('/{transaction}', [TransactionController::class, 'show']);
    });

    Route::get('/manager/analytics/dashboard', [ManagerAnalyticsController::class, 'dashboard']);
    Route::post('/admin/system/backup-now', [AdminSystemController::class, 'backupNow']);
    Route::get('/admin/system/backup-last/download', [AdminSystemController::class, 'downloadLastBackup']);
    Route::delete('/admin/system/activity-logs', [AdminSystemController::class, 'clearActivityLogs']);
});
