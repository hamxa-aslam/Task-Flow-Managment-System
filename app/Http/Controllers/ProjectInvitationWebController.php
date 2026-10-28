<?php

namespace App\Http\Controllers;

use App\Models\ProjectInvitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProjectInvitationWebController extends Controller
{
    public function accept(Request $request)
    {
        $token = $request->query('token') ?? $request->route('token');
        $invitation = ProjectInvitation::where('token', $token)->firstOrFail();

        if ($invitation->status !== 'pending' || $invitation->isExpired()) {
            return redirect(rtrim((string) config('app.frontend_url', config('app.url')), '/') . '/?invitation=expired');
        }

        $user = Auth::user();

        if (! $user) {
            $request->session()->put('invitation_token', $invitation->token);
            $request->session()->put('invitation_email', $invitation->email);

            $existingUser = User::where('email', strtolower($invitation->email))->first();

            if ($existingUser) {
                return redirect(rtrim((string) config('app.frontend_url', config('app.url')), '/') . '/login?invitation=pending&email=' . urlencode($invitation->email));
            }

            return redirect(rtrim((string) config('app.frontend_url', config('app.url')), '/') . '/register?invitation=pending&email=' . urlencode($invitation->email));
        }

        if (strtolower($user->email) !== strtolower($invitation->email)) {
            return redirect(rtrim((string) config('app.frontend_url', config('app.url')), '/') . '/?invitation=email-mismatch');
        }

        $project = $invitation->project;

        if ($project && ! $project->hasMember($user)) {
            $project->members()->attach($user->id);
        }

        $invitation->markApproved();
        $request->session()->forget(['invitation_token', 'invitation_email']);

        return redirect(rtrim((string) config('app.frontend_url', config('app.url')), '/') . '/?invitation=accepted');
    }
}
