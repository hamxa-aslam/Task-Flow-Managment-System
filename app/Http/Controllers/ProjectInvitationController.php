<?php

namespace App\Http\Controllers;

use App\Mail\ProjectInvitationMail;
use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ProjectInvitationController extends Controller
{
    public function invite(Request $request, Project $project)
    {
        $user = $request->user();

        if (! $user->isAdmin()) {
            if ($user->isManager()) {
                if ($project->workspace?->user_id !== $user->id && ! $project->hasMember($user)) {
                    abort(403, 'You are not allowed to invite users to this project.');
                }
            } else {
                abort(403, 'You are not allowed to invite users to this project.');
            }
        }

        $request->merge([
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);

        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $email = $data['email'];

        $existingUser = User::where('email', $email)->first();
        if ($existingUser && $project->hasMember($existingUser)) {
            return response()->json(['message' => 'User is already a member of this project.'], 422);
        }

        ProjectInvitation::where('project_id', $project->id)
            ->where('email', $email)
            ->where('status', 'pending')
            ->update(['status' => 'rejected']);

        $invitation = ProjectInvitation::create([
            'project_id' => $project->id,
            'email' => $email,
            'invited_by' => $user->id,
            'token' => Str::uuid()->toString(),
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        $invitation->load('project', 'inviter');

        Mail::to($email)->queue(new ProjectInvitationMail($invitation, $project, $user));

        return response()->json([
            'message' => 'Invitation sent successfully.',
            'data' => $invitation,
        ], 201);
    }

    public function pending(Request $request)
    {
        $user = $request->user();

        $invitations = ProjectInvitation::with(['project.workspace', 'inviter'])
            ->where('email', strtolower($user->email))
            ->where('status', 'pending')
            ->where(function ($query) {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $invitations]);
    }

    public function accept(Request $request, ProjectInvitation $invitation)
    {
        $user = $request->user();

        // Agar user login nahi hai, toh frontend ke login page par token ke sath redirect karein
        if (! $user) {
            $frontendLoginUrl = 'http://localhost:5173/login?token=' . $invitation->token;
            return redirect($frontendLoginUrl);
        }

        if (strtolower($user->email) !== strtolower($invitation->email)) {
            abort(403, 'This invitation was sent to a different email address.');
        }

        if ($invitation->status !== 'pending' || $invitation->isExpired()) {
            return response()->json(['message' => 'This invitation is no longer valid.'], 422);
        }

        $project = $invitation->project;

        if (! $project->hasMember($user)) {
            $project->members()->attach($user->id);
        }

        $invitation->markApproved();

        return response()->json([
            'message' => 'Invitation accepted successfully.',
            'data' => $invitation->load('project'),
        ]);
    }

    public function reject(Request $request, ProjectInvitation $invitation)
    {
        $user = $request->user();

        if (strtolower($user->email) !== strtolower($invitation->email)) {
            abort(403, 'This invitation was sent to a different email address.');
        }

        if ($invitation->status !== 'pending') {
            return response()->json(['message' => 'This invitation is no longer valid.'], 422);
        }

        $invitation->markRejected();

        return response()->json([
            'message' => 'Invitation rejected successfully.',
        ]);
    }
}