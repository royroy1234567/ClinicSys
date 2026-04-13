<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification Code</title>
</head>
<body style="margin:0;padding:0;background:#eef2ff;font-family:Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2ff;padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
                    <tr>
                        <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:24px;">
                            <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#bfdbfe;font-weight:700;">ClinicSys</div>
                            <h1 style="margin:8px 0 0;font-size:22px;line-height:1.2;color:#ffffff;">
                                {{
                                  ($purpose ?? 'verify') === '2fa'
                                    ? 'Secure Login Verification'
                                    : (($purpose ?? 'verify') === 'password_reset' ? 'Reset Your Password' : 'Verify Your Email')
                                }}
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:22px;text-align:center;">
                            <p style="margin:0 0 10px;font-size:14px;color:#334155;">
                                {{
                                  ($purpose ?? 'verify') === '2fa'
                                    ? 'Use this OTP code to continue login:'
                                    : (($purpose ?? 'verify') === 'password_reset'
                                      ? 'Use this OTP code to reset your password:'
                                      : 'Use this OTP code to continue registration:')
                                }}
                            </p>
                            <div style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:14px 18px;font-size:30px;font-weight:800;letter-spacing:8px;color:#1d4ed8;">
                                {{ $otpCode }}
                            </div>
                            <p style="margin:14px 0 0;font-size:13px;color:#475569;">
                                This code expires in <strong>{{ ($purpose ?? 'verify') === 'password_reset' ? '5 minutes' : '10 minutes' }}</strong>.
                            </p>
                            <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">If you did not request this, you can safely ignore this email.</p>
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

