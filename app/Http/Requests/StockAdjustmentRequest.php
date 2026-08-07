<?php

namespace App\Http\Requests;

use App\Models\StockTransaction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StockAdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('medicines.stock.adjust') ?? false;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'transaction_type' => ['required', Rule::in([
                StockTransaction::TYPE_STOCK_IN,
                StockTransaction::TYPE_STOCK_OUT,
                StockTransaction::TYPE_ADJUSTMENT,
                StockTransaction::TYPE_RETURNED,
                StockTransaction::TYPE_EXPIRED,
            ])],
            'quantity' => ['required', 'integer', 'min:0', 'max:1000000000'],
            'remarks' => ['nullable', 'string', 'max:4000'],
        ];
    }
}
