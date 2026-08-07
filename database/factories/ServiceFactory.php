<?php

namespace Database\Factories;

use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Service>
 */
class ServiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'service_code' => 'SVC-'.fake()->unique()->numerify('######'),
            'name' => fake()->words(3, true),
            'description' => fake()->optional()->sentence(),
            'category' => fake()->randomElement(Service::CATEGORIES),
            'price' => fake()->randomFloat(2, 100, 5000),
            'status' => Service::STATUS_ACTIVE,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => ['status' => Service::STATUS_INACTIVE]);
    }
}
