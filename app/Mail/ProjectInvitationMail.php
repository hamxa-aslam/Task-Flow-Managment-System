<?php

namespace App\Mail;

use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProjectInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public ProjectInvitation $invitation,
        public Project $project,
        public User $inviter,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Invitation to join ' . $this->project->name,
        );
    }

    public function content(): Content
    {
        $frontendUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/');
        $acceptUrl = $frontendUrl . '/invitations/accept?token=' . $this->invitation->token;

        return new Content(
            view: 'emails.project-invitation',
            with: [
                'invitation' => $this->invitation,
                'project' => $this->project,
                'inviter' => $this->inviter,
                'acceptUrl' => $acceptUrl,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
