<?php

namespace Database\Factories;

use App\Models\Service;
use App\Models\ServicePriceHistory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ServicePriceHistory>
 */
class ServicePriceHistoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'service_id' => Service::factory(),
            'old_price' => fake()->randomFloat(2, 100, 3000),
            'new_price' => fake()->randomFloat(2, 100, 3000),
            'changed_by' => User::factory(),
        ];
    }
}
