<?php

namespace Database\Factories;

use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Patient>
 */
class PatientFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'patient_code' => 'PAT-'.now()->format('Ymd').'-'.fake()->unique()->bothify('######'),
            'first_name' => fake()->firstName(),
            'middle_name' => fake()->optional()->firstName(),
            'last_name' => fake()->lastName(),
            'suffix' => fake()->optional(0.1)->suffix(),
            'gender' => fake()->randomElement(['female', 'male', 'other']),
            'birthdate' => fake()->dateTimeBetween('-80 years', '-1 year')->format('Y-m-d'),
            'civil_status' => fake()->randomElement(['single', 'married', 'widowed', 'separated']),
            'contact_number' => fake()->unique()->numerify('09#########'),
            'email' => fake()->optional()->safeEmail(),
            'address' => fake()->address(),
            'emergency_contact_name' => fake()->optional()->name(),
            'emergency_contact_number' => fake()->optional()->numerify('09#########'),
            'blood_type' => fake()->optional()->randomElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
            'allergies' => fake()->optional()->sentence(),
            'existing_conditions' => fake()->optional()->sentence(),
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
