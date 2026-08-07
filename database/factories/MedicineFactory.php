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
        $currentStock = fake()->numberBetween(10, 500);

        return [
            'medicine_code' => fake()->unique()->bothify('MED-#####'),
            'sku' => fake()->unique()->bothify('MED-#####'),
            'name' => fake()->randomElement(['Paracetamol 500 mg', 'Amoxicillin 500 mg', 'Cetirizine 10 mg']).' '.fake()->unique()->numerify('##'),
            'generic_name' => fake()->randomElement(['Paracetamol', 'Amoxicillin', 'Cetirizine']),
            'brand_name' => fake()->optional()->company(),
            'category' => fake()->randomElement(Medicine::CATEGORIES),
            'dosage_form' => fake()->randomElement(Medicine::DOSAGE_FORMS),
            'strength' => fake()->randomElement(['250 mg', '500 mg', '10 mg']),
            'unit' => fake()->randomElement(['tablet', 'capsule', 'bottle']),
            'current_stock' => $currentStock,
            'reorder_level' => fake()->numberBetween(5, 20),
            'expiry_date' => fake()->dateTimeBetween('+1 month', '+2 years')->format('Y-m-d'),
            'selling_price' => fake()->randomFloat(2, 5, 300),
            'cost_price' => fake()->randomFloat(2, 2, 250),
            'status' => Medicine::STATUS_ACTIVE,
            'stock_quantity' => $currentStock,
            'is_active' => true,
        ];
    }

    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes): array => [
            'current_stock' => 0,
            'stock_quantity' => 0,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => [
            'status' => Medicine::STATUS_INACTIVE,
            'is_active' => false,
        ]);
    }
}
