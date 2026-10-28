<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use App\Notifications\TaskCompletedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TaskCompletionNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_completing_a_task_notifies_the_assigned_user(): void
    {
        Notification::fake();

        [$admin, $assignee, $task] = $this->createAssignedTask();

        Sanctum::actingAs($admin);

        $this->patchJson("/api/tasks/{$task->id}/status", [
            'status' => 'completed',
        ])->assertOk()
            ->assertJsonPath('data.status', 'completed');

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'status' => 'completed',
        ]);

        Notification::assertSentTo(
            $assignee,
            TaskCompletedNotification::class,
            fn (TaskCompletedNotification $notification) => $notification->task->is($task)
                && $notification->completedBy?->is($admin)
        );
    }

    public function test_completing_a_task_through_the_full_update_endpoint_notifies_the_assigned_user(): void
    {
        Notification::fake();

        [$admin, $assignee, $task] = $this->createAssignedTask();

        Sanctum::actingAs($admin);

        $this->putJson("/api/tasks/{$task->id}", [
            'title' => $task->title,
            'description' => $task->description,
            'project_id' => $task->project_id,
            'status' => 'completed',
            'assigned_to' => $assignee->id,
            'due_date' => $task->due_date,
        ])->assertOk()
            ->assertJsonPath('data.status', 'completed');

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'status' => 'completed',
        ]);

        Notification::assertSentTo(
            $assignee,
            TaskCompletedNotification::class,
            fn (TaskCompletedNotification $notification) => $notification->task->is($task)
                && $notification->completedBy?->is($admin)
        );
    }

    public function test_done_is_accepted_as_an_alias_for_completed(): void
    {
        Notification::fake();

        [$admin, $assignee, $task] = $this->createAssignedTask();

        Sanctum::actingAs($admin);

        $this->patchJson("/api/tasks/{$task->id}/status", [
            'status' => 'done',
        ])->assertOk()
            ->assertJsonPath('data.status', 'completed');

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'status' => 'completed',
        ]);

        Notification::assertSentTo($assignee, TaskCompletedNotification::class);
    }

    public function test_non_completion_status_does_not_send_a_completion_notification(): void
    {
        Notification::fake();

        [$admin, $assignee, $task] = $this->createAssignedTask();

        Sanctum::actingAs($admin);

        $this->patchJson("/api/tasks/{$task->id}/status", [
            'status' => 'in_progress',
        ])->assertOk()
            ->assertJsonPath('data.status', 'in_progress');

        Notification::assertNotSentTo($assignee, TaskCompletedNotification::class);
    }

    public function test_completion_mail_contains_task_details_and_the_completing_user(): void
    {
        [$admin, $assignee, $task] = $this->createAssignedTask();

        $mail = (new TaskCompletedNotification($task, $admin))->toMail($assignee);

        $this->assertSame('Task Completed: '.$task->title, $mail->subject);
        $this->assertSame('Hello '.$assignee->name.',', $mail->greeting);
        $this->assertContains(
            'The task "'.$task->title.'" under project '.$task->project->name.' has been marked as completed.',
            $mail->introLines
        );
        $this->assertContains('Completed by: '.$admin->name, $mail->introLines);
        $this->assertSame(rtrim((string) config('app.frontend_url'), '/').'/', $mail->actionUrl);
    }

    /**
     * @return array{0: User, 1: User, 2: Task}
     */
    private function createAssignedTask(): array
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $assignee = User::factory()->create(['role' => 'team_member']);

        $workspace = Workspace::create([
            'name' => 'Notification Workspace',
            'description' => 'Used to verify task completion emails.',
            'user_id' => $assignee->id,
        ]);

        $project = Project::create([
            'name' => 'Notification Project',
            'description' => 'Used to verify task completion emails.',
            'workspace_id' => $workspace->id,
            'status' => 'pending',
        ]);

        $task = Task::create([
            'title' => 'Complete notification coverage',
            'description' => 'Verify that completion emails are delivered.',
            'project_id' => $project->id,
            'status' => 'pending',
            'assigned_to' => $assignee->id,
            'due_date' => now()->addDays(3)->toDateString(),
        ]);

        return [$admin, $assignee, $task];
    }
}
