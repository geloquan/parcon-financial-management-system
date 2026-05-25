<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\CoffeeSale;
use App\Models\EtherealSale;
use App\Models\GcashSale;
use App\Models\PrintSale;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SalesEndpointsFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_gcash_store_sets_default_charged_amount_for_non_debt_and_requires_remarks_for_debt(): void
    {
        [$user, $token] = $this->createAdminUserWithToken();
        $business = Business::query()->create(['name' => 'GCash', 'slug' => 'gcash']);

        $payload = [
            'transaction_recipient' => 'Customer A',
            'amount_moved' => 100,
            'sales_amount' => 150,
            'transaction_type' => 'cash_in',
            'transaction_date' => now()->toIso8601String(),
            'reauth_username' => $user->username,
            'reauth_password' => 'password123',
        ];

        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson("/api/businesses/{$business->id}/gcash_sales", $payload);

        $response->assertOk()->assertJsonPath('data.is_debt', false);
        $this->assertDatabaseHas('gcash_sales', [
            'business_id' => $business->id,
            'is_debt' => 0,
            'charged_amount' => 150.00,
        ]);

        $debtResponse = $this->withHeaders($this->authHeaders($token))
            ->postJson("/api/businesses/{$business->id}/gcash_sales", [
                ...$payload,
                'transaction_recipient' => 'Customer Debt',
                'is_debt' => true,
                'charged_amount' => null,
                'remarks' => '',
            ]);

        $debtResponse->assertStatus(422)->assertJsonValidationErrors(['remarks']);
    }

    public function test_coffee_store_sets_default_charged_amount_for_non_debt_and_requires_remarks_for_debt(): void
    {
        [$user, $token] = $this->createAdminUserWithToken();
        $business = Business::query()->create(['name' => 'Coffee', 'slug' => 'coffee']);

        $payload = [
            'price' => 80,
            'coffee_type' => 'Latte',
            'size' => '12oz',
            'add_on_price' => 20,
            'add_on_description' => 'Syrup',
            'sale_date' => now()->toIso8601String(),
            'reauth_username' => $user->username,
            'reauth_password' => 'password123',
        ];

        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson("/api/businesses/{$business->id}/coffee_sales", $payload);

        $response->assertOk()->assertJsonPath('data.is_debt', false);
        $this->assertDatabaseHas('coffee_sales', [
            'business_id' => $business->id,
            'is_debt' => 0,
            'charged_amount' => 100.00,
        ]);

        $debtResponse = $this->withHeaders($this->authHeaders($token))
            ->postJson("/api/businesses/{$business->id}/coffee_sales", [
                ...$payload,
                'coffee_type' => 'Debt Latte',
                'is_debt' => true,
                'charged_amount' => null,
                'remarks' => '',
            ]);

        $debtResponse->assertStatus(422)->assertJsonValidationErrors(['remarks']);
    }

    public function test_print_store_sets_default_charged_amount_for_non_debt_and_requires_remarks_for_debt(): void
    {
        [$user, $token] = $this->createAdminUserWithToken();
        $business = Business::query()->create(['name' => 'Print', 'slug' => 'print']);

        $payload = [
            'job_type' => 'xerox',
            'description' => 'Document copy',
            'color_mode' => 'black',
            'print_size' => 'short',
            'paper_count' => 3,
            'sales_amount' => 75,
            'sale_date' => now()->toIso8601String(),
            'reauth_username' => $user->username,
            'reauth_password' => 'password123',
        ];

        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson("/api/businesses/{$business->id}/print_sales", $payload);

        $response->assertOk()->assertJsonPath('data.is_debt', false);
        $this->assertDatabaseHas('print_sales', [
            'business_id' => $business->id,
            'is_debt' => 0,
            'charged_amount' => 75.00,
        ]);

        $debtResponse = $this->withHeaders($this->authHeaders($token))
            ->postJson("/api/businesses/{$business->id}/print_sales", [
                ...$payload,
                'description' => 'Debt print',
                'is_debt' => true,
                'charged_amount' => null,
                'remarks' => '',
            ]);

        $debtResponse->assertStatus(422)->assertJsonValidationErrors(['remarks']);
    }

    public function test_ethereal_store_sets_default_charged_amount_for_non_debt_and_requires_remarks_for_debt(): void
    {
        [$user, $token] = $this->createAdminUserWithToken();
        $business = Business::query()->create(['name' => 'Ethereal', 'slug' => 'ethereal']);
        $staff = Staff::query()->create([
            'business_id' => $business->id,
            'full_name' => 'Stylist One',
            'age' => 24,
            'employment_start_date' => now()->subYear()->toDateString(),
            'employment_type' => 'full_time',
            'salary' => 500,
            'is_active' => true,
        ]);

        $payload = [
            'staff_ids' => [$staff->id],
            'service_name' => 'Facial',
            'service_cost' => 500,
            'discount_percentage' => 10,
            'discount_type' => 'promo',
            'service_date' => now()->toIso8601String(),
            'reauth_username' => $user->username,
            'reauth_password' => 'password123',
        ];

        $response = $this->withHeaders($this->authHeaders($token))
            ->postJson("/api/businesses/{$business->id}/ethereal_sales", $payload);

        $response->assertOk()->assertJsonPath('data.is_debt', false);
        $this->assertDatabaseHas('ethereal_sales', [
            'business_id' => $business->id,
            'is_debt' => 0,
            'charged_amount' => 450.00,
        ]);

        $debtResponse = $this->withHeaders($this->authHeaders($token))
            ->postJson("/api/businesses/{$business->id}/ethereal_sales", [
                ...$payload,
                'service_name' => 'Debt facial',
                'is_debt' => true,
                'charged_amount' => null,
                'remarks' => '',
            ]);

        $debtResponse->assertStatus(422)->assertJsonValidationErrors(['remarks']);
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
