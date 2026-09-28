import { Link, router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type NotificationItem = {
    id: string;
    data: {
        title: string;
        message: string;
        url: string;
        type: string;
    };
    created_at: string;
};

type BroadcastNotification = {
    id: string;
    title: string;
    message: string;
    url: string;
    level: string;
};

type AuthProps = {
    user: { id: number };
    unread_count: number;
    unread_notifications: NotificationItem[];
};

export default function NotificationBell() {
    const { auth } = usePage().props as { auth: AuthProps };

    return (
        <NotificationBellContent
            key={`${auth.unread_count}:${auth.unread_notifications?.[0]?.id ?? ''}`}
            auth={auth}
        />
    );
}

function NotificationBellContent({ auth }: { auth: AuthProps }) {
    const [unreadCount, setUnreadCount] = useState(auth.unread_count ?? 0);
    const [notifications, setNotifications] = useState<NotificationItem[]>(auth.unread_notifications ?? []);
    const knownNotificationIds = useRef(new Set((auth.unread_notifications ?? []).map((item) => item.id)));

    useEffect(() => {
        if (!auth.user?.id || !window.Echo) {
            return;
        }

        const channelName = `App.Models.User.${auth.user.id}`;
        window.Echo.private(channelName).notification((notification: BroadcastNotification) => {
            if (!notification.id || knownNotificationIds.current.has(notification.id)) {
                return;
            }

            knownNotificationIds.current.add(notification.id);
            const item: NotificationItem = {
                id: notification.id,
                data: {
                    title: notification.title,
                    message: notification.message,
                    url: notification.url,
                    type: notification.level,
                },
                created_at: new Date().toISOString(),
            };

            toast[notification.level === 'danger' ? 'error' : 'info'](notification.title, {
                description: notification.message,
            });
            setUnreadCount((count) => count + 1);
            setNotifications((current) => [item, ...current].slice(0, 5));
        });

        return () => window.Echo.leave(channelName);
    }, [auth.user.id]);

    const markAsRead = (id: string, url: string) => {
        router.patch(`/notifications/${id}/read`, {}, {
            onSuccess: () => {
                setNotifications((current) => current.filter((item) => item.id !== id));
                setUnreadCount((count) => Math.max(0, count - 1));

                if (url && url !== '#') {
                    router.visit(url);
                }
            },
        });
    };

    return (
        <div className="relative group">
            {/* Tombol Lonceng */}
            <Link href="/notifications" className="relative p-2 rounded-full hover:bg-slate-100 flex items-center">
                <Bell className="size-5 text-slate-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Link>

            {/* Dropdown Quick View (Opsional, muncul saat di-hover/klik) */}
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-lg rounded-xl hidden group-hover:block z-50">
                <div className="p-3 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h4 className="font-bold text-sm">Notifikasi</h4>
                </div>
                <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <p className="p-4 text-center text-xs text-slate-500">Belum ada notifikasi baru.</p>
                    ) : (
                        notifications.map((notif: any) => (
                            <button 
                                key={notif.id} 
                                onClick={() => markAsRead(notif.id, notif.data.url)}
                                className="w-full text-left p-3 border-b hover:bg-slate-50 transition"
                            >
                                <p className="text-sm font-bold text-slate-800">{notif.data.title}</p>
                                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{notif.data.message}</p>
                            </button>
                        ))
                    )}
                </div>
                <Link href="/notifications" className="block text-center p-2 text-xs font-semibold text-blue-600 hover:bg-slate-50 rounded-b-xl">
                    Lihat Semua Riwayat
                </Link>
            </div>
        </div>
    );
}