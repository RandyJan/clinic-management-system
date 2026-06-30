<?php

namespace Database\Factories;

use App\Models\Medicine;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Medicine> */
class MedicineFactory extends Factory
{
    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'sku' => fake()->unique()->bothify('MED-#####'),
            'name' => fake()->randomElement(['Paracetamol 500 mg', 'Amoxicillin 500 mg', 'Cetirizine 10 mg']).' '.fake()->unique()->numerify('##'),
            'unit' => fake()->randomElement(['tablet', 'capsule', 'bottle']),
            'stock_quantity' => fake()->numberBetween(10, 500),
            'is_active' => true,
        ];
    }

    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes): array => ['stock_quantity' => 0]);
    }
}
