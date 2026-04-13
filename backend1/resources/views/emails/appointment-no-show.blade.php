<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Missed Appointment</title></head>
<body style="margin:0;padding:0;background:#eef2ff;font-family:Arial,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:24px;color:#fff;"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#fde68a;font-weight:700;">ClinicSys</div><h1 style="margin:8px 0 0;font-size:22px;">Missed Appointment Notice</h1></td></tr>
<tr><td style="padding:22px;">
<p style="margin:0 0 12px;">Hi <strong>{{ $patientName ?: 'Patient' }}</strong>, your appointment was marked as no-show.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px;">
<tr><td style="font-size:13px;padding:6px 0;"><strong>Date:</strong> {{ $appointment->appointment_date }}</td></tr>
<tr><td style="font-size:13px;padding:6px 0;"><strong>Time:</strong> {{ \Illuminate\Support\Str::of((string) $appointment->appointment_time)->substr(0, 5) }}</td></tr>
<tr><td style="font-size:13px;padding:6px 0;"><strong>Doctor:</strong> {{ $doctorName ?: 'TBD' }}</td></tr>
</table>
<p style="margin:12px 0 0;font-size:13px;color:#475569;">Please rebook when you are available.</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>

