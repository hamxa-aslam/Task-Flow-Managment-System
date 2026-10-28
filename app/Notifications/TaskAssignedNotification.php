<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class TaskAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Task $task)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $dueDate = $this->task->due_date
            ? Carbon::parse($this->task->due_date)->format('F j, Y')
            : 'No due date';

        $projectName = $this->task->project?->name ?? 'your project';

        $frontendUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/');

        return (new MailMessage)
            ->subject('New Task Assigned: ' . $this->task->title)
            ->greeting('Hello ' . ($notifiable->name ?: 'there') . ',')
            ->line('You have been assigned a new task: **' . $this->task->title . '**')
            ->line('Project: ' . $projectName)
            ->line('Description: ' . ($this->task->description ?: 'No description provided.'))
            ->line('Due Date: ' . $dueDate)
            ->action('View Tasks', $frontendUrl . '/')
            ->line('Thank you for using our application!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'task_id' => $this->task->id,
            'title' => $this->task->title,
            'project_id' => $this->task->project_id,
            'assigned_to' => $this->task->assigned_to,
            'due_date' => $this->task->due_date,
            'status' => $this->task->status,
        ];
    }
}