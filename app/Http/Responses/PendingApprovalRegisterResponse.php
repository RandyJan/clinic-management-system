<?php

namespace App\Http\Responses;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\RegisterResponse;

class PendingApprovalRegisterResponse implements RegisterResponse
{
    public function toResponse($request): RedirectResponse
    {
        /** @var Request $request */
        Auth::guard(config('fortify.guard'))->logout();

        $request->session()->regenerateToken();

        return redirect()
            ->route('login')
            ->with('status', 'Your account has been created and is pending administrator approval.');
    }
}
