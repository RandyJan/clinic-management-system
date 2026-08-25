<?php

namespace Database\Factories;

use App\Models\Clinic;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Clinic>
 */
class ClinicFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->company().' Clinic',
            'slug' => fake()->unique()->slug(),
            'email' => fake()->companyEmail(),
            'contact_number' => fake()->numerify('09#########'),
            'address' => fake()->address(),
            'status' => Clinic::STATUS_ACTIVE,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => [
            'status' => Clinic::STATUS_INACTIVE,
        ]);
    }
}
