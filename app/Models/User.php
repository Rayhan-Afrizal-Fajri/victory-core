<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
// use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

#[Fillable(['name', 'email', 'password', 'is_active'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasRoles;

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
        ];
    }

    public function createdPesanan()
    {
        return $this->hasMany(Pesanan::class, 'created_by');
    }

    public function customer()
    {
        return $this->hasOne(Customer::class);
    }

    public function paymentVerified()
    {
        return $this->hasMany(Payment::class, 'verified_by');
    }

    public function designer()
    {
        return $this->hasMany(Design::class, 'designer_id');
    }

    public function designApprovedBy()
    {
        return $this->hasMany(Design::class, 'approved_by');
    }

    public function sampleApprovedBy()
    {
        return $this->hasMany(Sample::class, 'approved_by');
    }

    public function materialReceivingCheckedBy()
    {
        return $this->hasMany(MaterialReceiving::class, 'checked_by');
    }

    public function workflowHistory()
    {
        return $this->hasMany(WorkflowHistory::class);
    }

    public function attachmentUploadedBy()
    {
        return $this->hasMany(Attachment::class, 'uploaded_by');
    }

    public function quotationCreatedBy()
    {
        return $this->hasMany(Quotation::class, 'created_by');
    }
}
