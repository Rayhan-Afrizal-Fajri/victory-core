import React, { useState, useEffect } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationBell() {
    const { auth } = usePage().props as any;
    
    const [unreadCount, setUnreadCount] = useState(auth.unread_count);
    const [notifications, setNotifications] = useState(auth.unread_notifications);

    // GUNAKAN USE EFFECT SEBAGAI PENGGANTI HOOK
    useEffect(() => {
        // Pastikan Echo sudah diinisialisasi di resources/js/bootstrap.js atau echo.js
        if (window.Echo) {
            const channelName = `App.Models.User.${auth.user.id}`;
            
            // Harus pakai .private() dan .notification()
            window.Echo.private(channelName)
                .notification((notification: any) => {
                    console.log('Sinyal notifikasi masuk!', notification); // Cek console browser Anda

                    // 1. Munculkan Toast (akses dari notification.data)
                    toast[notification.data.type === 'danger' ? 'error' : 'info'](
                        notification.data.title, { description: notification.data.message }
                    );

                    // 2. Tambah angka
                    setUnreadCount((prev: number) => prev + 1);

                    // 3. Masukkan ke state dengan format yang disesuaikan
                    const formattedNotif = {
                        id: notification.id,
                        data: {
                            title: notification.data.title,
                            message: notification.data.message,
                            url: notification.data.url,
                            type: notification.data.type
                        },
                        created_at: new Date().toISOString(),
                    };

                    setNotifications((prev: any[]) => [formattedNotif, ...prev].slice(0, 5));
                });

            // Cleanup
            return () => {
                window.Echo.leave(channelName);
            };
        } else {
            console.error("window.Echo tidak ditemukan. Pastikan Echo di-import di app.tsx / bootstrap.js");
        }
    }, [auth.user.id]);

    const markAsRead = (id: string, url: string) => {
        router.patch(`/notifications/${id}/read`, {}, {
            onSuccess: () => router.visit(url)
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