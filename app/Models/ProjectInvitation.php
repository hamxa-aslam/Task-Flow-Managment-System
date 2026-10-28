<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class ProjectInvitation extends Model
{
    protected $fillable = [
        'project_id',
        'email',
        'invited_by',
        'token',
        'status',
        'expires_at',
        'accepted_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }
      
    
    public function getRouteKeyName(): string
    {
        return 'token';
    }
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public function isExpired(): bool
    {
        return $this->expires_at && Carbon::now()->greaterThan($this->expires_at);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending' && ! $this->isExpired();
    }

    public function markApproved(): void
    {
        $this->status = 'approved';
        $this->accepted_at = now();
        $this->save();
    }

    public function markRejected(): void
    {
        $this->status = 'rejected';
        $this->save();
    }
}
