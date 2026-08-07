<?php

namespace App\Http\Requests;

use App\Models\Billing;
use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $billing = $this->route('billing');

        return $billing instanceof Billing
            && ($this->user()?->can('recordPayment', $billing) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'payment_method' => ['required', Rule::in(Payment::METHODS)],
            'amount_paid' => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'remarks' => ['nullable', 'string', 'max:4000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'payment_method.required' => 'The payment method is required.',
            'amount_paid.required' => 'The payment amount is required.',
            'amount_paid.numeric' => 'The payment amount must be numeric.',
        ];
    }
}
