<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Admin-only user directory with workload counts.
     */
    public function index(Request $request)
    {
        $this->ensureAdmin($request);

        $users = User::query()
            ->withCount([
                'tasks as assigned_tasks_count',
                'workspaces as workspaces_count',
            ])
            ->orderByRaw("CASE role WHEN 'admin' THEN 0 WHEN 'manager' THEN 1 ELSE 2 END")
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $users]);
    }

    /**
     * Create a new user from the admin Users module.
     */
    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $request->merge([
            'name' => trim((string) $request->input('name')),
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            'role' => ['required', Rule::in(['admin', 'manager', 'team_member'])],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
            'role' => $data['role'],
        ]);

        $user->loadCount([
            'tasks as assigned_tasks_count',
            'workspaces as workspaces_count',
        ]);

        return response()->json([
            'message' => 'User created successfully.',
            'data' => $user,
        ], 201);
    }

    /**
     * Users available as task assignees for admins and managers.
     */
    public function assignees(Request $request)
    {
        $user = $request->user();

        abort_unless(
            $user->isAdmin() || $user->isManager(),
            403,
            'You are not allowed to view assignees.'
        );

        $users = User::query()
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        return response()->json(['data' => $users]);
    }

    /**
     * Update the authenticated user's profile details.
     */
    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $user->update(['name' => trim($data['name'])]);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'data' => $user->fresh(),
        ]);
    }

    /**
     * Update a team member's role. Admins cannot change their own role.
     */
    public function updateRole(Request $request, User $user)
    {
        $this->ensureAdmin($request);

        abort_if(
            $user->is($request->user()),
            422,
            'You cannot change your own role.'
        );

        $data = $request->validate([
            'role' => ['required', 'in:admin,manager,team_member'],
        ]);

        $user->update($data);
        $user->loadCount([
            'tasks as assigned_tasks_count',
            'workspaces as workspaces_count',
        ]);

        return response()->json([
            'message' => 'Role updated successfully.',
            'data' => $user,
        ]);
    }

    private function ensureAdmin(Request $request): void
    {
        abort_unless(
            $request->user()->isAdmin(),
            403,
            'Only administrators can manage users.'
        );
    }
}
