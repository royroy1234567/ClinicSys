<?php

use App\Http\Controllers\PatientsController;
use App\Http\Controllers\ClinicUsersController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GoogleController;

// Handle OPTIONS preflight for CORS
Route::options('patients/register', function () {
    return response()->json([], 200);
});

// Register route
Route::post('patients/register', [PatientsController::class, 'register']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn(Request $r) => $r->user());
});

Route::get('/auth/google', [GoogleController::class, 'redirectToGoogle']);
Route::get('/auth/google/callback', [GoogleController::class, 'handleGoogleCallback']);

Route::get('/test', function () {
    return response()->json(['status' => 'api working']);
});

Route::apiResource('users', ClinicUsersController::class);
Route::patch('users/{id}/toggle-status', [ClinicUsersController::class, 'toggleStatus']);
Route::post('patients/check-email', [PatientsController::class, 'checkEmail']);