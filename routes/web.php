<?php

use App\Http\Controllers\ProjectInvitationController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return ['Laravel' => app()->version()];
});

// Web Route for Accepting Invitation directly from Email (Protected by auth middleware so user must log in first)
Route::get('/invitations/{invitation}/accept', [ProjectInvitationController::class, 'accept'])
    
    ->name('invitations.accept');

require __DIR__.'/auth.php';