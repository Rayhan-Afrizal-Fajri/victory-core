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
    actor_id?: number | null;
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

            // Cegah dobel toast jika notifikasi berasal dari aksi user sendiri
            const isSelfAction = notification.actor_id && Number(notification.actor_id) === Number(auth.user.id);
            if (!isSelfAction) {
                toast[notification.level === 'danger' ? 'error' : 'info'](notification.title, {
                    description: notification.message,
                });
            }

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
            <Link
                href="/notifications"
                className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200 active:scale-95"
                title="Notifikasi"
            >
                <Bell className="size-4.5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground shadow-xs animate-in zoom-in-50">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Link>

            {/* Dropdown Quick View */}
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border/80 bg-popover/95 backdrop-blur-xl shadow-xl hidden group-hover:block z-50 overflow-hidden transition-all duration-200">
                <div className="p-3.5 border-b border-border/60 flex justify-between items-center bg-muted/40">
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Notifikasi</h4>
                    {unreadCount > 0 && (
                        <span className="text-[11px] font-medium text-primary">
                            {unreadCount} baru
                        </span>
                    )}
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
                    {notifications.length === 0 ? (
                        <p className="p-5 text-center text-xs text-muted-foreground">Belum ada notifikasi baru.</p>
                    ) : (
                        notifications.map((notif: any) => (
                            <button 
                                key={notif.id} 
                                onClick={() => markAsRead(notif.id, notif.data.url)}
                                className="w-full text-left p-3.5 hover:bg-accent/60 transition cursor-pointer"
                            >
                                <p className="text-sm font-medium text-foreground">{notif.data.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.data.message}</p>
                            </button>
                        ))
                    )}
                </div>
                <Link
                    href="/notifications"
                    className="block text-center py-2.5 px-3 text-xs font-medium text-primary hover:bg-accent/40 border-t border-border/50 transition-colors"
                >
                    Lihat Semua Riwayat
                </Link>
            </div>
        </div>
    );
}