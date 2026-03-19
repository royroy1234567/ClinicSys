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