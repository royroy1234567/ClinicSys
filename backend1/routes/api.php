<?php

use App\Http\Controllers\PatientsController;
use App\Http\Controllers\ClinicUsersController;
use App\Http\Controllers\ServicsController;
use App\Http\Controllers\GoogleController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DoctorScheduleController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\TransactionController;
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

// Google OAuth
Route::get('/auth/google',          [GoogleController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [GoogleController::class, 'handleGoogleCallback']);

// Patient public routes
Route::post('/patients/register',    [PatientsController::class, 'register']);
Route::post('/patients/check-email', [PatientsController::class, 'checkEmail']);

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

    // Clinic Users
    Route::apiResource('users', ClinicUsersController::class);
    Route::patch('users/{id}/toggle-status', [ClinicUsersController::class, 'toggleStatus']);

    // Services
    Route::apiResource('servics', ServicsController::class);
    Route::patch('servics/{service}/toggle-status', [ServicsController::class, 'toggleStatus']);

    // Patients
    Route::get('/patients',                          [PatientsController::class, 'index']);
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
    });

    // Transactions (POS)
    Route::prefix('transactions')->group(function () {
        Route::get('/',        [TransactionController::class, 'index']);
        Route::post('/',       [TransactionController::class, 'store']);
        Route::get('/{transaction}', [TransactionController::class, 'show']);
    });
});