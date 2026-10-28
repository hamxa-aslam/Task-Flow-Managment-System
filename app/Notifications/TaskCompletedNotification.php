<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;

class TaskCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Task $task,
        public ?User $completedBy = null
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $this->task->loadMissing(['project', 'assignee']);

        $projectName = $this->task->project?->name ?? 'your project';
        $completedByName = $this->completedBy?->name
            ?? $this->task->assignee?->name
            ?? 'a team member';
        $frontendUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/');

        return (new MailMessage)
            ->subject('Task Completed: '.$this->task->title)
            ->greeting('Hello '.($notifiable->name ?: 'there').',')
            ->line('The task "'.$this->task->title.'" under project '.$projectName.' has been marked as completed.')
            ->line('Completed by: '.$completedByName)
            ->action('View Tasks', $frontendUrl.'/')
            ->line('Please review the work. Thank you for using our application!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'task_id' => $this->task->id,
            'title' => $this->task->title,
            'status' => $this->task->status,
            'completed_by' => $this->completedBy?->id,
        ];
    }
}
