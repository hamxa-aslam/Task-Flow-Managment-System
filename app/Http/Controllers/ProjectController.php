<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Workspace;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    /**
     * List projects visible to the authenticated user's role.
     */
    public function index(Request $request)
    {
        $projects = Project::query()
            ->visibleTo($request->user())
            ->with([
                'workspace:id,name,user_id',
                'workspace.user:id,name',
            ])
            ->withCount([
                'tasks',
                'tasks as completed_tasks_count' => fn ($query) => $query->where('status', 'completed'),
            ])
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $projects]);
    }

    /**
     * Create a new project.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        abort_unless(
            $user->isAdmin() || $user->isManager(),
            403,
            'Only administrators and managers can create projects.'
        );

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'workspace_id' => ['nullable', 'integer', 'exists:workspaces,id'],
        ]);

        $workspaceId = $data['workspace_id'] ?? null;

        if (! $workspaceId) {
            if ($user->isManager()) {
                $workspace = $user->workspaces()->first() ?? Workspace::create([
                    'name' => $user->name . "'s Workspace",
                    'user_id' => $user->id,
                ]);
                $workspaceId = $workspace->id;
            } elseif ($user->isAdmin()) {
                $workspace = Workspace::first() ?? Workspace::create([
                    'name' => 'Default Workspace',
                    'user_id' => $user->id,
                ]);
                $workspaceId = $workspace->id;
            }
        }

        if ($user->isManager() && $workspaceId) {
            $workspace = Workspace::find($workspaceId);
            abort_unless($workspace && $workspace->user_id === $user->id, 403, 'You can only create projects in your own workspace.');
        }

        $project = Project::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'workspace_id' => $workspaceId,
            'status' => 'pending',
        ]);

        $project->load([
            'workspace:id,name,user_id',
            'workspace.user:id,name',
        ])->loadCount([
            'tasks',
            'tasks as completed_tasks_count' => fn ($query) => $query->where('status', 'completed'),
        ]);

        return response()->json([
            'message' => 'Project created successfully.',
            'data' => $project,
        ], 201);
    }
}
