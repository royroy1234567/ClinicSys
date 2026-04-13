<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#eef2ff;font-family:Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2ff;padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
                    <tr>
                        <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:24px;">
                            <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#bfdbfe;font-weight:700;">ClinicSys</div>
                            <h1 style="margin:8px 0 0;font-size:22px;line-height:1.2;color:#ffffff;">Appointment Confirmed</h1>
                            <p style="margin:8px 0 0;color:#dbeafe;font-size:13px;">Your booking has been successfully scheduled.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:22px;">
                            <p style="margin:0 0 14px;font-size:14px;">Hi <strong>{{ $patientName ?: 'Patient' }}</strong>,</p>
                            <p style="margin:0 0 16px;font-size:14px;color:#334155;">Here are your appointment details:</p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;">
                                <tr><td style="font-size:13px;padding:6px 0;"><strong>Appointment ID:</strong> #{{ $appointment->appointment_id }}</td></tr>
                                <tr><td style="font-size:13px;padding:6px 0;"><strong>Date:</strong> {{ $appointment->appointment_date }}</td></tr>
                                <tr><td style="font-size:13px;padding:6px 0;"><strong>Time:</strong> {{ \Illuminate\Support\Str::of((string) $appointment->appointment_time)->substr(0, 5) }}</td></tr>
                                <tr><td style="font-size:13px;padding:6px 0;"><strong>Doctor:</strong> {{ $doctorName ?: 'TBD' }}</td></tr>
                                <tr><td style="font-size:13px;padding:6px 0;"><strong>Service:</strong> {{ $serviceName }}</td></tr>
                            </table>

                            <p style="margin:16px 0 0;font-size:13px;color:#475569;">Please arrive 10–15 minutes early.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 22px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
                            This is an automated message from ClinicSys.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

