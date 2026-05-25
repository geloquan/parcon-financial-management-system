<?php

namespace Tests\Feature;

use App\Models\CapitalMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PortfolioCapitalValidationFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_portfolio_debt_requires_remarks(): void
    {
        [$user, $token] = $this->createAdminUserWithToken();

        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson('/api/portfolio_capital/movements', [
                'amount' => 500,
                'direction' => 'debt',
                'occurred_on' => now()->toDateString(),
                'remarks' => '',
                'reauth_username' => $user->username,
                'reauth_password' => 'password123',
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['remarks']);
    }

    public function test_portfolio_transfer_requires_target_business(): void
    {
        [$user, $token] = $this->createAdminUserWithToken();

        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson('/api/portfolio_capital/movements', [
                'amount' => 500,
                'direction' => 'transfer',
                'occurred_on' => now()->toDateString(),
                'reauth_username' => $user->username,
                'reauth_password' => 'password123',
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['target_business_id']);
    }

    public function test_settle_endpoint_rejects_non_debt_records(): void
    {
        [$user, $token] = $this->createAdminUserWithToken();

        $movement = CapitalMovement::query()->create([
            'initiated_by_user_id' => $user->id,
            'amount' => 250,
            'direction' => 'add',
            'source_type' => 'portfolio',
            'source_business_id' => null,
            'target_business_id' => null,
            'occurred_on' => now()->toDateString(),
            'notes' => 'Top-up',
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson("/api/portfolio_capital/movements/{$movement->id}/settle", [
                'reauth_username' => $user->username,
                'reauth_password' => 'password123',
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['movement']);
    }

    public function test_portfolio_debt_creation_sets_outstanding_status(): void
    {
        [$user, $token] = $this->createAdminUserWithToken();

        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson('/api/portfolio_capital/movements', [
                'amount' => 700,
                'direction' => 'debt',
                'occurred_on' => now()->toDateString(),
                'target_business_id' => null,
                'remarks' => 'Temporary debt issued',
                'reauth_username' => $user->username,
                'reauth_password' => 'password123',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.direction', 'debt')
            ->assertJsonPath('data.debt_status', 'outstanding')
            ->assertJsonPath('data.remarks', 'Temporary debt issued');

        $this->assertDatabaseHas('capital_movements', [
            'direction' => 'debt',
            'debt_status' => 'outstanding',
            'remarks' => 'Temporary debt issued',
        ]);
    }

    public function test_settling_debt_marks_record_and_adds_portfolio_inflow(): void
    {
        [$user, $token] = $this->createAdminUserWithToken();

        $movement = CapitalMovement::query()->create([
            'initiated_by_user_id' => $user->id,
            'amount' => 350,
            'direction' => 'debt',
            'source_type' => 'portfolio',
            'source_business_id' => null,
            'target_business_id' => null,
            'occurred_on' => now()->toDateString(),
            'remarks' => 'For urgent supplier payment',
            'debt_status' => 'outstanding',
        ]);

        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson("/api/portfolio_capital/movements/{$movement->id}/settle", [
                'reauth_username' => $user->username,
                'reauth_password' => 'password123',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.id', $movement->id)
            ->assertJsonPath('data.debt_status', 'settled');

        $this->assertDatabaseHas('capital_movements', [
            'id' => $movement->id,
            'debt_status' => 'settled',
            'settled_by_user_id' => $user->id,
        ]);

        $this->assertDatabaseHas('capital_movements', [
            'initiated_by_user_id' => $user->id,
            'amount' => 350,
            'direction' => 'add',
            'source_type' => 'portfolio',
            'notes' => "Debt settlement received for record #{$movement->id}.",
            'remarks' => 'For urgent supplier payment',
        ]);
    }

    private function createAdminUserWithToken(): array
    {
        Role::findOrCreate('admin');

        $plainToken = 'token-'.bin2hex(random_bytes(16));
        $user = User::factory()->create([
            'username' => 'admin_'.bin2hex(random_bytes(4)),
            'password' => Hash::make('password123'),
            'api_token' => Hash::make($plainToken),
        ]);
        $user->syncRoles(['admin']);

        return [$user, $plainToken];
    }

    private function authHeaders(string $token): array
    {
        return [
            'Authorization' => "Bearer {$token}",
            'Accept' => 'application/json',
        ];
    }
}
