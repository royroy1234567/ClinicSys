<?php

use App\Http\Controllers\PatientsController;
use App\Http\Controllers\ClinicUsersController;
use App\Http\Controllers\ServicsController;
use App\Http\Controllers\GoogleController;
use App\Http\Controllers\AuthController;
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

// Clinic Users
Route::apiResource('users', ClinicUsersController::class);
Route::patch('users/{id}/toggle-status', [ClinicUsersController::class, 'toggleStatus']);

// Services
Route::apiResource('servics', ServicsController::class);
Route::patch('servics/{service}/toggle-status', [ServicsController::class, 'toggleStatus']);

/*
|--------------------------------------------------------------------------
| Protected Routes (auth:sanctum)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // Authenticated user info
    Route::get('/user', fn(Request $r) => $r->user());

    // Password gate for Manage User modal
    Route::post('/auth/verify-password', [AuthController::class, 'verifyPassword']);

    // Patients
    Route::get('/patients',           [PatientsController::class, 'index']);
    Route::get('/patient/profile',    [PatientsController::class, 'profile']);
    Route::put('/patient/profile',    [PatientsController::class, 'updateProfile']);
    Route::put('/patient/password',   [PatientsController::class, 'updatePassword']);
});