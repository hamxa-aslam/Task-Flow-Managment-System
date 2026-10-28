<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    protected $fillable = [
        'name',
        'description',
        'workspace_id',
        'status',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_members')->withTimestamps();
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(ProjectInvitation::class);
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->isAdmin()) {
            return $query;
        }

        if ($user->isManager()) {
            return $query->where(function (Builder $q) use ($user) {
                $q->whereHas(
                    'workspace',
                    fn (Builder $workspace) => $workspace->where('user_id', $user->id)
                )->orWhereHas('members', fn (Builder $members) => $members->where('users.id', $user->id));
            });
        }

        return $query->where(function (Builder $q) use ($user) {
            $q->whereHas(
                'tasks',
                fn (Builder $tasks) => $tasks->where('assigned_to', $user->id)
            )->orWhereHas('members', fn (Builder $members) => $members->where('users.id', $user->id));
        });
    }

    public function hasMember(User $user): bool
    {
        return $this->members()->where('users.id', $user->id)->exists();
    }
}
