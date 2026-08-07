<?php

namespace Database\Factories;

use App\Models\Billing;
use App\Models\BillingItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<BillingItem> */
class BillingItemFactory extends Factory
{
    protected $model = BillingItem::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 3);
        $unitPrice = fake()->randomFloat(2, 100, 1500);

        return [
            'billing_id' => Billing::factory(),
            'service_id' => null,
            'item_type' => fake()->randomElement(BillingItem::TYPES),
            'description' => fake()->words(3, true),
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'total_price' => round($quantity * $unitPrice, 2),
        ];
    }
}
