<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class SystemNotification extends Notification
{
    use Queueable;

    private $title;

    private $message;

    private $url;

    private $type;

    private $actorId;

    public function __construct($title, $message, $url = '#', $type = 'info', ?int $actorId = null)
    {
        $this->title = $title;
        $this->message = $message;
        $this->url = $url;
        $this->type = $type;
        $this->actorId = $actorId ?? auth()->id();
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
            'actor_id' => $this->actorId,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return (new BroadcastMessage([
            'id' => $this->id,
            'title' => $this->title,
            'message' => $this->message,
            'url' => $this->url,
            'level' => $this->type,
            'actor_id' => $this->actorId,
        ]))->onConnection('sync');
    }
}
