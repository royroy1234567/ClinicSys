<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class MaintenanceModeGuard
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('api/auth/login') || $request->is('api/auth/logout')) {
            return $next($request);
        }

        $maintenance = DB::table('clinic_settings')
            ->where('key', 'system_maintenance_mode')
            ->value('value');
        $maintenanceOn = in_array(strtolower((string) $maintenance), ['1', 'true', 'yes', 'on'], true);

        if (!$maintenanceOn) {
            return $next($request);
        }

        $isAdmin = false;
        $auth = $request->header('Authorization');
        $token = null;
        if ($auth && str_starts_with($auth, 'Bearer ')) {
            $token = trim(substr($auth, 7));
        } elseif ($request->cookie('auth_token')) {
            $token = (string) $request->cookie('auth_token');
        }

        if ($token) {
            $pat = PersonalAccessToken::findToken($token);
            $role = strtolower((string) ($pat?->tokenable?->role ?? ''));
            $isAdmin = $role === 'admin';
        }

        if (!$isAdmin) {
            return response()->json([
                'message' => 'System is under maintenance. Please try again later.',
            ], 503);
        }

        return $next($request);
    }
}

