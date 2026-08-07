<?php

namespace Database\Factories;

use App\Models\Medicine;
use App\Models\StockTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockTransaction>
 */
class StockTransactionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $previousStock = fake()->numberBetween(0, 200);
        $quantity = fake()->numberBetween(1, 25);

        return [
            'medicine_id' => Medicine::factory(),
            'transaction_type' => fake()->randomElement(StockTransaction::TYPES),
            'quantity' => $quantity,
            'previous_stock' => $previousStock,
            'new_stock' => $previousStock + $quantity,
            'reference_type' => null,
            'reference_id' => null,
            'remarks' => fake()->optional()->sentence(),
            'created_by' => User::factory(),
        ];
    }
}
