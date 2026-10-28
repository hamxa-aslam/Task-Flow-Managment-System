<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskAssignedNotification;
use App\Notifications\TaskCompletedNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class TaskService
{
    /**
     * Create a task and notify the assignee.
     */
    public function createTask(array $data): Task
    {
        $assignedTo = $data['assigned_to'] ?? Auth::id();

        if (blank($assignedTo)) {
            throw ValidationException::withMessages([
                'assigned_to' => 'A task must be assigned to a user.',
            ]);
        }

        $assignedTo = (int) $assignedTo;

        if (! User::query()->whereKey($assignedTo)->exists()) {
            throw ValidationException::withMessages([
                'assigned_to' => 'The selected assignee does not exist.',
            ]);
        }

        $data['assigned_to'] = $assignedTo;

        if (array_key_exists('status', $data)) {
            $data['status'] = $this->normalizeStatus($data['status']);
        }

        $task = Task::create($data);
        $task->loadMissing(['assignee', 'project.workspace.user']);

        if ($task->assignee) {
            $task->assignee->notify(new TaskAssignedNotification($task));
        }

        return $task;
    }

    /**
     * Update a task and notify the assignee when it transitions to completed.
     */
    public function updateTask(Task $task, array $data, ?User $updatedBy = null): Task
    {
        $previousStatus = $task->status;

        if (array_key_exists('status', $data)) {
            $data['status'] = $this->normalizeStatus($data['status']);
        }

        $task->update($data);
        $task->loadMissing(['project.workspace.user', 'assignee']);

        if ($task->status === 'completed' && $previousStatus !== 'completed') {
            $this->notifyTaskCompleted($task, $updatedBy);
        }

        return $task;
    }

    /**
     * Update task status and notify the assignee when the task is completed.
     */
    public function updateTaskStatus(Task $task, string $status, ?User $completedBy = null): Task
    {
        return $this->updateTask($task, ['status' => $status], $completedBy);
    }

    private function normalizeStatus(string $status): string
    {
        // Treat "done" as an alias for the database's "completed" status.
        return strtolower($status) === 'done' ? 'completed' : $status;
    }

    private function notifyTaskCompleted(Task $task, ?User $completedBy): void
    {
        $recipient = $task->assignee ?? $task->project?->workspace?->user;

        // Send now so the configured MAIL_MAILER (including "log") records
        // the completion email immediately instead of waiting for a worker.
        $recipient?->notifyNow(
            new TaskCompletedNotification($task, $completedBy)
        );
    }
}
