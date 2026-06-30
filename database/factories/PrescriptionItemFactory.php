<?php

namespace Database\Factories;

use App\Models\Prescription;
use App\Models\PrescriptionItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<PrescriptionItem> */
class PrescriptionItemFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'prescription_id' => Prescription::factory(),
            'medicine_id' => null,
            'medicine_name' => fake()->word().' '.fake()->numberBetween(100, 500).' mg',
            'dosage' => '1 tablet',
            'frequency' => 'Every 8 hours',
            'duration' => '7 days',
            'quantity' => 21,
            'instructions' => fake()->optional()->sentence(),
        ];
    }
}
