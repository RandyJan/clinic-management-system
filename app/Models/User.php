<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'username',
        'password',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function getAuthPasswordName(): string
    {
        return 'password';
    }

    public function receivesBroadcastNotificationsOn(): string
    {
        return 'user.notifications.'.$this->id;
    }

    /**
     * @return HasOne<Doctor, $this>
     */
    public function doctor(): HasOne
    {
        return $this->hasOne(Doctor::class);
    }

    /**
     * @return HasOne<Patient, $this>
     */
    public function patient(): HasOne
    {
        return $this->hasOne(Patient::class);
    }

    public function clinicMemberships(): HasMany
    {
        return $this->hasMany(ClinicMembership::class);
    }

    public function clinics(): BelongsToMany
    {
        return $this->belongsToMany(Clinic::class)
            ->using(ClinicMembership::class)
            ->withPivot(['id', 'role_id', 'status'])
            ->withTimestamps();
    }
}
