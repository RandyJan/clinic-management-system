<?php

namespace Database\Factories;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Doctor>
 */
class DoctorFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'doctor_code' => 'DOC-'.now()->format('Ymd').'-'.fake()->unique()->bothify('######'),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'specialization' => fake()->randomElement(['Family Medicine', 'Pediatrics', 'Internal Medicine', 'Cardiology']),
            'license_number' => fake()->unique()->bothify('PRC-######'),
            'contact_number' => fake()->numerify('09#########'),
            'email' => fake()->safeEmail(),
            'consultation_fee' => fake()->randomFloat(2, 300, 2500),
            'schedule' => 'Monday to Friday, 9:00 AM - 5:00 PM',
            'status' => 'active',
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }
}
