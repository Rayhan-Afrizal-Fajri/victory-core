<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\SystemNotification;
use Illuminate\Support\Facades\Notification;

class NotificationService
{
    /**
     * Helper general untuk mengirim notifikasi berdasarkan permission
     */
    public static function notifyByPermission(string $permission, string $title, string $message, string $url, string $type = 'info'): void
    {
        $users = User::permission($permission)->get();

        if ($users->isNotEmpty()) {
            Notification::send($users, new SystemNotification($title, $message, $url, $type));
        }
    }

    /**
     * Method spesifik untuk Approval Desain
     */
    public static function sendDesignApprovalNotification($pesanan): void
    {
        self::notifyByPermission(
            'designs.approve',
            'Desain menunggu approval',
            "Desain untuk produk '{$pesanan->produk}' telah diunggah dan menunggu persetujuan Anda.",
            "/job-tickets/{$pesanan->job_ticket_id}?tab=design",
            'info'
        );
    }
}

?>