<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'title',
        'description',
        'project_id',
        'status',
        'assigned_to',
        'due_date',
    ];
    public function project()
    {
        return $this->belongsTo(Project::class);        
    }
    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->isAdmin()) {
            return $query;
        }

        if ($user->isManager()) {
            return $query->where(function (Builder $query) use ($user) {
                $query->where('assigned_to', $user->id)
                    ->orWhereHas(
                        'project.workspace',
                        fn (Builder $workspace) => $workspace->where('user_id', $user->id)
                    );
            });
        }

        return $query->where('assigned_to', $user->id);
    }
}