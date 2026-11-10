<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = $user->notifications();

        $filter = $request->get('filter', 'all');
        if ($filter === 'unread') {
            $query->whereNull('read_at');
        } elseif ($filter === 'read') {
            $query->whereNotNull('read_at');
        }

        $perPage = (int) $request->get('per_page', 10);
        $notifications = $query->paginate($perPage)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json($notifications);
        }

        return Inertia::render('notifications/Index', [
            'notifications' => $notifications,
            'unreadCount' => $user->unreadNotifications()->count(),
            'currentFilter' => $filter,
        ]);
    }

    public function markAsRead(Request $request, $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'unreadCount' => $request->user()->unreadNotifications()->count(),
            ]);
        }

        return back();
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'unreadCount' => 0,
            ]);
        }

        return back()->with('success', 'Semua Notifikasi telah ditandai dibaca.');
    }
}
