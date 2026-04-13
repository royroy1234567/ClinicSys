<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consultation Completed</title>
</head>
<body style="margin:0;padding:0;background:#eef2ff;font-family:Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2ff;padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
                    <tr>
                        <td style="background:linear-gradient(135deg,#0f766e,#0d9488);padding:24px;">
                            <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#99f6e4;font-weight:700;">ClinicSys</div>
                            <h1 style="margin:8px 0 0;font-size:22px;line-height:1.2;color:#ffffff;">Consultation Completed</h1>
                            <p style="margin:8px 0 0;color:#ccfbf1;font-size:13px;">Your consultation summary and receipt are ready.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:22px;">
                            <p style="margin:0 0 14px;font-size:14px;">Hi <strong>{{ $patientName ?: 'Patient' }}</strong>,</p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;">
                                <tr><td style="font-size:13px;padding:6px 0;"><strong>Consultation ID:</strong> #{{ $consultation->consultation_id }}</td></tr>
                                <tr><td style="font-size:13px;padding:6px 0;"><strong>Doctor:</strong> {{ $doctorName ?: 'TBD' }}</td></tr>
                                <tr><td style="font-size:13px;padding:6px 0;"><strong>Diagnosis:</strong> {{ $consultation->diagnosis ?: 'N/A' }}</td></tr>
                                <tr><td style="font-size:13px;padding:6px 0;"><strong>Notes:</strong> {{ $consultation->notes ?: 'N/A' }}</td></tr>
                            </table>

                            @if($transaction)
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:14px;background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;padding:14px;">
                                    <tr><td style="font-size:13px;padding:6px 0;"><strong>Receipt No:</strong> {{ $transaction->transaction_number }}</td></tr>
                                    <tr><td style="font-size:13px;padding:6px 0;"><strong>Total:</strong> ₱{{ number_format((float) $transaction->total, 2) }}</td></tr>
                                    <tr><td style="font-size:13px;padding:6px 0;"><strong>Payment Method:</strong> {{ strtoupper((string) $transaction->payment_method) }}</td></tr>
                                </table>
                            @endif
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

