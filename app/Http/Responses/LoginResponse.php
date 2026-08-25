<?php

namespace App\Http\Responses;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): JsonResponse|RedirectResponse
    {
        /** @var Request $request */
        if ($request->wantsJson()) {
            return response()->json(null, 204);
        }

        $user = $request->user();
        if ($user instanceof User && $user->hasRole('Platform Administrator')) {
            return redirect()->route('platform.clinics.index');
        }

        return redirect()->intended(route('dashboard'));
    }
}
