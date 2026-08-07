<?php

namespace App\Http\Requests;

use App\Models\Billing;
use Illuminate\Foundation\Http\FormRequest;

class CancelBillingRequest extends FormRequest
{
    public function authorize(): bool
    {
        $billing = $this->route('billing');

        return $billing instanceof Billing
            && ($this->user()?->can('cancel', $billing) ?? false);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'remarks' => ['required', 'string', 'max:4000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'remarks.required' => 'Cancellation remarks are required.',
        ];
    }
}
