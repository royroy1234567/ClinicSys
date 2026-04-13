<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Appointment Cancelled</title></head>
<body style="margin:0;padding:0;background:#eef2ff;font-family:Arial,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
<tr><td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:24px;color:#fff;"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#fecaca;font-weight:700;">ClinicSys</div><h1 style="margin:8px 0 0;font-size:22px;">Appointment Cancelled</h1></td></tr>
<tr><td style="padding:22px;">
<p style="margin:0 0 12px;">Hi <strong>{{ $patientName ?: 'Patient' }}</strong>, your appointment has been cancelled.</p>
<p style="margin:0;font-size:13px;color:#475569;">Reason: {{ $appointment->cancellation_reason ?: 'Not specified' }}</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>

