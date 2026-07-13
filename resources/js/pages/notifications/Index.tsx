import { Head, router, Link } from '@inertiajs/react';
import { Bell, CheckCheck, CheckCircle2, Clock, Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';

// --- TYPES ---
export type NotificationData = {
    title?: string;
    message?: string;
    url?: string;
    [key: string]: any;
};

export type Notification = {
    id: string;
    type: string;
    notifiable_type: string;
    notifiable_id: number;
    data: NotificationData;
    read_at: string | null;
    created_at: string;
    updated_at: string;
};

// Tipe data bawaan dari Laravel Pagination
export type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

interface Props {
    notifications: PaginatedData<Notification>;
}

export default function Index({ notifications }: Props) {
    // --- HANDLERS ---
    const markAsRead = (id: string) => {
        // Asumsi route name yang digunakan adalah 'notifications.markAsRead'
        // Jika menggunakan URL manual, bisa diganti ke `/notifications/${id}/mark-as-read` dsb.
        router.patch(route('notifications.markAsRead', id), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Notifikasi telah ditandai dibaca')
        });
    };

    const markAllAsRead = () => {
        if (confirm('Tandai semua notifikasi sebagai telah dibaca?')) {
            router.patch(route('notifications.markAllAsRead'), {}, {
                preserveScroll: true,
                onSuccess: () => toast.success('Semua notifikasi telah ditandai dibaca')
            });
        }
    };

    // Helper untuk memformat tanggal
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { 
            day: 'numeric', month: 'short', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    const hasUnread = notifications.data.some(n => n.read_at === null);

    return (
        <div className="space-y-6">
            <Head title="Riwayat Notifikasi" />

            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                        <Bell className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Semua Notifikasi</h2>
                        <p className="text-sm text-gray-500">
                            Menampilkan {notifications.data.length} dari total {notifications.total} notifikasi
                        </p>
                    </div>
                </div>

                {hasUnread && (
                    <Button 
                        variant="outline" 
                        onClick={markAllAsRead}
                        className="flex items-center gap-2"
                    >
                        <CheckCheck className="h-4 w-4" />
                        Tandai Semua Dibaca
                    </Button>
                )}
            </div>

            {/* Notification List */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                {notifications.data.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center text-gray-500">
                        <Bell className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-lg font-medium">Belum ada notifikasi</p>
                        <p className="text-sm">Anda akan melihat notifikasi baru di sini.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.data.map((notification) => {
                            const isUnread = notification.read_at === null;

                            return (
                                <div 
                                    key={notification.id} 
                                    className={`p-4 flex gap-4 transition-colors hover:bg-gray-50 ${isUnread ? 'bg-blue-50/30' : 'bg-white'}`}
                                >
                                    <div className="shrink-0 mt-1">
                                        {isUnread ? (
                                            <div className="h-2 w-2 mt-2 rounded-full bg-blue-600 ring-4 ring-blue-100"></div>
                                        ) : (
                                            <Info className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start gap-4">
                                            <h3 className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {notification.data.title || 'Pemberitahuan Sistem'}
                                            </h3>
                                            <span className="flex items-center text-xs text-gray-500 whitespace-nowrap">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {formatDate(notification.created_at)}
                                            </span>
                                        </div>
                                        
                                        <p className={`text-sm ${isUnread ? 'text-gray-700' : 'text-gray-500'}`}>
                                            {notification.data.message || 'Anda memiliki pemberitahuan baru terkait aktivitas sistem.'}
                                        </p>

                                        {notification.data.url && (
                                            <div className="pt-2">
                                                <Link 
                                                    href={notification.data.url}
                                                    className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    Lihat Detail &rarr;
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Mark as Read (Individual) */}
                                    {isUnread && (
                                        <div className="shrink-0 flex items-center">
                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                title="Tandai dibaca"
                                            >
                                                <CheckCircle2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {notifications.last_page > 1 && (
                <div className="flex justify-center mt-6">
                    <div className="flex flex-wrap gap-1 bg-white p-1 rounded-lg border shadow-sm">
                        {notifications.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                    link.active 
                                    ? 'bg-blue-600 text-white font-medium' 
                                    : link.url 
                                        ? 'text-gray-600 hover:bg-gray-100' 
                                        : 'text-gray-300 cursor-not-allowed'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                preserveScroll
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Menggunakan layout persis seperti halaman contoh yang Anda berikan
Index.layout = (page: ReactNode) => (
    <AppLayout 
        title="Riwayat Notifikasi" 
        information="Personal · Inbox" 
        description="Kelola dan pantau semua riwayat notifikasi Anda."
    >
        {page}
    </AppLayout>
);