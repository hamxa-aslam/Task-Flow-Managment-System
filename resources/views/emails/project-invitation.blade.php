<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Project Invitation</title>
</head>
<body>
    <h2>You're invited to join {{ $project->name}}</h2>
    <p>Hello,</p>
    <p>{{ $inviter->name}} has invited you to join the project <strong>{{$project->name }}</strong>.</p>
    <p>
        <a href="{{ route('invitations.accept', $invitation->token) }}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Accept Invitation
        </a>
    </p>
    <p>If you don't have an account, you'll be redirected to register and will automatically join the project after registration.</p>
    <p>If you didn't expect this invitation, you can ignore this email.</p>
</body>
</html>

