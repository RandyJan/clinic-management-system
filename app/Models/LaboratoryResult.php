<?php

namespace App\Models;

use Database\Factories\LaboratoryResultFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LaboratoryResult extends Model
{
    /** @use HasFactory<LaboratoryResultFactory> */
    use HasFactory;

    /** @var list<string> */
    protected $fillable = [
        'lab_request_id',
        'result_details',
        'attachment_path',
        'remarks',
        'uploaded_by',
        'uploaded_at',
    ];

    /** @return BelongsTo<LaboratoryRequest, $this> */
    public function labRequest(): BelongsTo
    {
        return $this->belongsTo(LaboratoryRequest::class, 'lab_request_id');
    }

    /** @return BelongsTo<User, $this> */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['uploaded_at' => 'datetime'];
    }
}
