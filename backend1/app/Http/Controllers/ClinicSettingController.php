<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClinicSettingController extends Controller
{
    /* GET /api/clinic-settings — public, no auth needed */
    public function index()
    {
        $rows = DB::table('clinic_settings')->get();
        $settings = [];
        foreach ($rows as $row) {
            $settings[$row->key] = $row->value;
        }
        return response()->json($settings);
    }

    /* POST /api/clinic-settings — admin only */
    public function update(Request $request)
    {
        $data = $request->validate([
            'name'     => 'nullable|string|max:255',
            'tagline'  => 'nullable|string|max:255',
            'address'  => 'nullable|string',
            'phone'    => 'nullable|string|max:50',
            'mobile'   => 'nullable|string|max:50',
            'email'    => 'nullable|email|max:255',
            'website'  => 'nullable|string|max:255',
            'tin'      => 'nullable|string|max:50',
            'phic'     => 'nullable|string|max:50',
            'schedule' => 'nullable|string|max:255',
            'security_two_factor'         => 'nullable|boolean',
            'security_two_factor_channel' => 'nullable|in:email',
            'security_session_timeout'    => 'nullable|in:0,15,30,60,120',
            'security_password_expiry'    => 'nullable|in:0,30,60,90,180',
            'security_login_attempts'     => 'nullable|in:3,5,10',
            'security_audit_log'          => 'nullable|boolean',
            'security_ip_restriction'     => 'nullable|boolean',
            'security_force_https'        => 'nullable|boolean',
            'system_auto_backup'          => 'nullable|boolean',
            'system_backup_frequency'     => 'nullable|in:hourly,daily,weekly,monthly',
            'system_backup_retention'     => 'nullable|in:7,14,30,90',
            'system_max_upload_size'      => 'nullable|in:5,10,25,50',
            'system_maintenance_mode'     => 'nullable|boolean',
            'system_last_backup_at'       => 'nullable|date',
        ]);

        foreach ($data as $key => $value) {
            DB::table('clinic_settings')->updateOrInsert(
                ['key' => $key],
                ['value' => $value, 'updated_at' => now()]
            );
        }

        return response()->json(['success' => true, 'message' => 'Settings saved.']);
    }
}
