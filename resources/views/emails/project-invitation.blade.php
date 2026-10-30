<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to ProjectFlow</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f4f6f9; padding: 40px 0;">
        <tr>
            <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                    
                    <!-- Header -->
                    <tr>
                        <td align="left" style="padding: 30px 40px 20px 40px; background-color: #0f172a;">
                            <h2 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.5px;">ProjectFlow</h2>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px;">
                            <h1 style="color: #1e293b; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 20px;">
                                You're invited to join {{ $project->name }}
                            </h1>
                            
                            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 20px;">
                                Hello,
                            </p>
                            
                            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 30px;">
                                <strong>{{ $inviter->name }}</strong> has invited you to collaborate on the project <strong>{{ $project->name }}</strong>. Join your team to start managing tasks and tracking progress seamlessly.
                            </p>

                            <!-- Call to Action Button -->
                            <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                                <tr>
                                    <td align="center" style="border-radius: 6px; background-color: #6366f1;">
                                        <a href="{{ isset($acceptUrl) ? $acceptUrl : route('invitations.accept', $invitation->token) }}" target="_blank" style="font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; border: 1px solid #6366f1; display: inline-block;">
                                            Accept Invitation
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-top: 0; margin-bottom: 10px;">
                                If you don't have an account, you'll be redirected to register and will automatically join the project after registration.
                            </p>

                            <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-top: 0; margin-bottom: 0;">
                                <em>This invitation link will expire in 48 hours. If you didn't expect this invitation, you can safely ignore this email.</em>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                                &copy; {{ date('Y') }} ProjectFlow. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>