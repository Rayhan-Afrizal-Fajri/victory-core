<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
// 1. Panggil ShouldBroadcastNow
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; 
use Illuminate\Notifications\Messages\BroadcastMessage;

// 2. Implementasikan ShouldBroadcastNow ke class
class SystemNotification extends Notification implements ShouldBroadcastNow 
{
    use Queueable;

    private $title;
    private $message;
    private $url;
    private $type;

    public function __construct($title, $message, $url = '#', $type = 'info')
    {
        $this->title = $title;
        $this->message = $message;
        $this->url = $url;
        $this->type = $type; 
    }

    public function via(object $notifiable): array
    {
        // 3. Pastikan 'broadcast' ada di sini
        return ['database', 'broadcast'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'url' => $this->url,
            'type' => $this->type,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            // Laravel secara otomatis akan membungkus ini dalam property `data` saat diterima di Frontend Echo
            'title' => $this->title,
            'message' => $this->message,
            'url' => $this->url,
            'type' => $this->type,
        ]);
    }
}
