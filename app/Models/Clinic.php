<?php

namespace App\Models;

use Database\Factories\ClinicFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Clinic extends Model
{
    /** @use HasFactory<ClinicFactory> */
    use HasFactory;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    /** @var list<string> */
    public const STATUSES = [self::STATUS_ACTIVE, self::STATUS_INACTIVE];

    /** @var list<string> */
    protected $fillable = [
        'name',
        'slug',
        'email',
        'contact_number',
        'address',
        'status',
    ];

    public function memberships(): HasMany
    {
        return $this->hasMany(ClinicMembership::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->using(ClinicMembership::class)
            ->withPivot(['id', 'role_id', 'status'])
            ->withTimestamps();
    }
}
