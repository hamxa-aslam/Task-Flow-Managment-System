<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Services\TaskService;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    private const TASK_RELATIONS = [
        'project:id,name,status,workspace_id',
        'project.workspace:id,user_id,name',
        'assignee:id,name,email,role',
    ];

    protected $taskService;

    public function __construct(TaskService $taskService)
    {
        $this->taskService = $taskService;
    }

    /**
     * Return tasks visible to the authenticated user's role.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $tasks = Task::query()
            ->visibleTo($user)
            ->with(self::TASK_RELATIONS)
            ->orderByRaw("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")
            ->orderBy('due_date')
            ->get()
            ->each(fn (Task $task) => $this->withAccessFlags($task, $user));

        return response()->json(['data' => $tasks]);
    }

    /**
     * Create a task inside a project the user is allowed to manage.
     */
    public function store(StoreTaskRequest $request)
    {
        $user = $request->user();

        abort_unless(
            $user->isAdmin() || $user->isManager(),
            403,
            'Only administrators and managers can create tasks.'
        );

        $project = Project::with('workspace')->findOrFail($request->validated()['project_id']);

        abort_unless(
            $user->canManageProject($project),
            403,
            'You are not allowed to add tasks to this project.'
        );

        $data = $request->validated();
        $data['assigned_to'] = isset($data['assigned_to']) && $data['assigned_to'] !== ''
            ? (int) $data['assigned_to']
            : $user->id;

        $task = $this->taskService->createTask($data)->load(self::TASK_RELATIONS);

        return response()->json([
            'message' => 'Task created successfully!',
            'data' => $this->withAccessFlags($task, $user),
        ], 201);
    }

    /**
     * Update a task the user is allowed to manage.
     */
    public function update(StoreTaskRequest $request, Task $task)
    {
        $user = $request->user();

        $this->ensureCanManageTask($user, $task);

        $data = $request->validated();

        if (array_key_exists('project_id', $data) && (int) $data['project_id'] !== (int) $task->project_id) {
            $project = Project::with('workspace')->findOrFail($data['project_id']);

            abort_unless(
                $user->canManageProject($project),
                403,
                'You are not allowed to move this task to that project.'
            );
        }

        if (array_key_exists('assigned_to', $data) && $data['assigned_to'] !== '') {
            $data['assigned_to'] = (int) $data['assigned_to'];
        } elseif (array_key_exists('assigned_to', $data)) {
            unset($data['assigned_to']);
        }

        $task = $this->taskService->updateTask($task, $data, $user);
        $task->load(self::TASK_RELATIONS);

        return response()->json([
            'message' => 'Task updated successfully!',
            'data' => $this->withAccessFlags($task, $user),
        ]);
    }

    /**
     * Update status when the user manages the task or is its assignee.
     */
    public function updateStatus(Request $request, Task $task)
    {
        $user = $request->user();

        abort_unless(
            $user->canUpdateTaskStatus($task),
            403,
            'You are not allowed to update this task status.'
        );

        $request->validate([
            'status' => 'required|in:pending,in_progress,completed,done',
        ]);

        $updatedTask = $this->taskService->updateTaskStatus($task, $request->status, $user)
            ->load(self::TASK_RELATIONS);

        return response()->json([
            'message' => 'Task status updated successfully!',
            'data' => $this->withAccessFlags($updatedTask, $user),
        ], 200);
    }

    /**
     * Delete a task the user is allowed to manage.
     */
    public function destroy(Request $request, Task $task)
    {
        $this->ensureCanManageTask($request->user(), $task);

        $task->delete();

        return response()->json(['message' => 'Task deleted successfully.']);
    }

    private function ensureCanManageTask(User $user, Task $task): void
    {
        abort_unless(
            $user->canManageTask($task),
            403,
            'You are not allowed to modify this task.'
        );
    }

    private function withAccessFlags(Task $task, User $user): Task
    {
        $task->setAttribute('can_manage', $user->canManageTask($task));
        $task->setAttribute('can_update_status', $user->canUpdateTaskStatus($task));

        return $task;
    }
}
