<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feedback Response</title>
</head>
<body style="margin:0;padding:0;background:#eef2ff;font-family:Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2ff;padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
                    <tr>
                        <td style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:24px;">
                            <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#bfdbfe;font-weight:700;">ClinicSys</div>
                            <h1 style="margin:8px 0 0;font-size:22px;line-height:1.2;color:#ffffff;">Response to Your Feedback</h1>
                            <p style="margin:8px 0 0;color:#dbeafe;font-size:13px;">Thank you for sharing your service feedback.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:22px;">
                            <p style="margin:0 0 14px;font-size:14px;">Hi <strong>{{ $patientName ?: 'Patient' }}</strong>,</p>
                            <p style="margin:0 0 14px;font-size:14px;color:#334155;">A manager has responded to your rated service feedback.</p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;">
                                <tr><td style="font-size:13px;padding:6px 0;"><strong>Consultation ID:</strong> #{{ $consultation->consultation_number }}</td></tr>
                                <tr><td style="font-size:13px;padding:6px 0;"><strong>Doctor:</strong> {{ $doctorName ?: 'TBD' }}</td></tr>
                                <tr><td style="font-size:13px;padding:6px 0;"><strong>Your Rating:</strong> {{ $consultation->session_rating ?? 'N/A' }}/5</td></tr>
                            </table>

                            <div style="margin-top:14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px;">
                                <p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#1d4ed8;font-weight:700;">ClinicSys Management</p>
                                <p style="margin:0;font-size:14px;line-height:1.6;color:#1e293b;white-space:pre-wrap;">{{ $responseMessage }}</p>
                                <p style="margin:10px 0 0;font-size:12px;color:#475569;">— {{ $responderName }}</p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f1f5f9;padding:14px;text-align:center;font-size:12px;color:#64748b;">
                            <p style="margin:0;">If you have further questions, please contact our support team.</p>
                            <p style="margin:4px 0 0;">&copy; {{ date('Y') }} ClinicSys. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
