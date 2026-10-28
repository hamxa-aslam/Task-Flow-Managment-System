<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminUserCreationTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_admin_can_create_a_user_with_a_hashed_password(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/users', [
            'name' => '  Ayesha Khan  ',
            'email' => '  AYESHA@EXAMPLE.COM  ',
            'password' => 'secret-password',
            'role' => 'team_member',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Ayesha Khan')
            ->assertJsonPath('data.email', 'ayesha@example.com')
            ->assertJsonPath('data.role', 'team_member')
            ->assertJsonPath('data.assigned_tasks_count', 0)
            ->assertJsonPath('data.workspaces_count', 0);

        $this->assertArrayNotHasKey('password', $response->json('data'));

        $user = User::where('email', 'ayesha@example.com')->firstOrFail();

        $this->assertSame('Ayesha Khan', $user->name);
        $this->assertSame('team_member', $user->role);
        $this->assertTrue(Hash::check('secret-password', $user->password));
    }

    public function test_an_admin_can_create_a_manager(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/users', [
            'name' => 'New Manager',
            'email' => 'new-manager@example.com',
            'password' => 'secret-password',
            'role' => 'manager',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.role', 'manager')
            ->assertJsonPath('data.email', 'new-manager@example.com');

        $this->assertDatabaseHas('users', [
            'email' => 'new-manager@example.com',
            'role' => 'manager',
        ]);
    }

    public function test_user_creation_validates_duplicate_email_password_and_role(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->create(['email' => 'taken@example.com']);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/users', [
            'name' => 'New User',
            'email' => 'TAKEN@example.com',
            'password' => 'short',
            'role' => 'owner',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password', 'role']);

        $this->assertDatabaseMissing('users', [
            'email' => 'taken@example.com',
            'name' => 'New User',
        ]);
    }

    public function test_user_creation_rejects_a_whitespace_only_name(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($admin);

        $this->postJson('/api/users', [
            'name' => '   ',
            'email' => 'blank-name@example.com',
            'password' => 'secret-password',
            'role' => 'team_member',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);

        $this->assertDatabaseMissing('users', [
            'email' => 'blank-name@example.com',
        ]);
    }

    public function test_non_admin_users_cannot_create_users(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);

        Sanctum::actingAs($manager);

        $this->postJson('/api/users', [
            'name' => 'Blocked User',
            'email' => 'blocked@example.com',
            'password' => 'secret-password',
            'role' => 'team_member',
        ])->assertForbidden();

        $this->assertDatabaseMissing('users', [
            'email' => 'blocked@example.com',
        ]);
    }
}
