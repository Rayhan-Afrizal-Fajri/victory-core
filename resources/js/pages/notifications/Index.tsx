import { Head, router, Link, usePage } from '@inertiajs/react';
import { 
    Bell, 
    CheckCheck, 
    CheckCircle2, 
    Clock, 
    Info, 
    Loader2, 
    ChevronDown, 
    ArrowRight, 
    Layers, 
    Sparkles, 
    Filter,
    ExternalLink
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    unreadCount?: number;
    currentFilter?: 'all' | 'unread' | 'read';
}

declare global {
    interface Window {
        Echo?: any;
    }
}

// Format waktu relatif (misal: "Baru saja", "5 menit yang lalu")
function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Baru saja';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} menit lalu`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} hari lalu`;

    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// Batas auto-scroll dalam 1 sesi (setara 3 batch / halaman = ~30 notifikasi)
const MAX_AUTO_BATCHES = 3;

export default function Index({ notifications, unreadCount = 0, currentFilter = 'all' }: Props) {
    const { auth } = usePage<{ auth?: { user?: { id: number } } }>().props;

    // State list notifikasi & pagination
    const [items, setItems] = useState<Notification[]>(notifications.data || []);
    const [currentPage, setCurrentPage] = useState<number>(notifications.current_page || 1);
    const [lastPage, setLastPage] = useState<number>(notifications.last_page || 1);
    const [total, setTotal] = useState<number>(notifications.total || 0);
    const [unreadTotal, setUnreadTotal] = useState<number>(unreadCount);
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read'>(currentFilter);

    // State infinite scroll & batasan (threshold)
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [autoBatchCount, setAutoBatchCount] = useState<number>(1);
    const [manualContinue, setManualContinue] = useState<boolean>(false);

    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Sinkronisasi saat props berubah (misal saat ganti filter atau pindah page dari URL)
    useEffect(() => {
        setItems(notifications.data || []);
        setCurrentPage(notifications.current_page || 1);
        setLastPage(notifications.last_page || 1);
        setTotal(notifications.total || 0);
        setAutoBatchCount(1);
        setManualContinue(false);
    }, [notifications]);

    useEffect(() => {
        setUnreadTotal(unreadCount);
    }, [unreadCount]);

    useEffect(() => {
        setActiveFilter(currentFilter);
    }, [currentFilter]);

    // Menentukan apakah infinite scroll sedang dijeda karena mencapai batas checkpoint
    const isPausedAtLimit = autoBatchCount >= MAX_AUTO_BATCHES && currentPage < lastPage && !manualContinue;

    // --- FETCH NEXT BATCH (Infinite Scroll) ---
    const loadNextBatch = useCallback(async () => {
        if (isLoadingMore || currentPage >= lastPage || isPausedAtLimit) {
            return;
        }

        setIsLoadingMore(true);
        const nextPage = currentPage + 1;

        try {
            const url = new URL('/notifications', window.location.origin);
            url.searchParams.set('page', String(nextPage));
            if (activeFilter !== 'all') {
                url.searchParams.set('filter', activeFilter);
            }

            const res = await fetch(url.toString(), {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!res.ok) {
                throw new Error('Gagal memuat notifikasi berikutnya');
            }

            const data: PaginatedData<Notification> = await res.json();

            setItems((prev) => {
                const existingIds = new Set(prev.map((i) => i.id));
                const newItems = (data.data || []).filter((item) => !existingIds.has(item.id));
                return [...prev, ...newItems];
            });

            setCurrentPage(data.current_page);
            setLastPage(data.last_page);
            setTotal(data.total);
            setAutoBatchCount((count) => count + 1);
            setManualContinue(false);
        } catch (error) {
            console.error('Error fetching next notifications batch:', error);
            toast.error('Gagal memuat notifikasi lainnya.');
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, currentPage, lastPage, isPausedAtLimit, activeFilter]);

    // --- INTERSECTION OBSERVER ---
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (first.isIntersecting && !isLoadingMore && currentPage < lastPage && !isPausedAtLimit) {
                    loadNextBatch();
                }
            },
            {
                rootMargin: '200px', // Pre-fetch 200px sebelum sampai paling bawah
                threshold: 0.1,
            }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loadNextBatch, isLoadingMore, currentPage, lastPage, isPausedAtLimit]);

    // --- REALTIME REVERB / ECHO NOTIFICATIONS ---
    useEffect(() => {
        if (typeof window === 'undefined' || !window.Echo) return;
        const userId = auth?.user?.id;
        if (!userId) return;

        const channelName = `App.Models.User.${userId}`;
        window.Echo.private(channelName).notification((notification: any) => {
            const newItem: Notification = {
                id: notification.id || String(Date.now()),
                type: notification.type || 'BroadcastNotification',
                notifiable_type: 'App\\Models\\User',
                notifiable_id: userId,
                data: {
                    title: notification.title,
                    message: notification.message,
                    url: notification.url,
                },
                read_at: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            setItems((prev) => [newItem, ...prev]);
            setTotal((t) => t + 1);
            setUnreadTotal((u) => u + 1);
        });

        return () => {
            window.Echo.leave(channelName);
        };
    }, [auth]);

    // --- HANDLERS ---
    const handleContinueAutoScroll = () => {
        setAutoBatchCount(1);
        setManualContinue(true);
        loadNextBatch();
    };

    const handleFilterChange = (filter: 'all' | 'unread' | 'read') => {
        setActiveFilter(filter);
        router.get(
            '/notifications',
            { filter: filter === 'all' ? undefined : filter },
            { preserveScroll: true, preserveState: false }
        );
    };

    const markAsRead = (id: string, url?: string, isToast: boolean = true) => {
        // Optimistic UI update
        setItems((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        );
        setUnreadTotal((prev) => Math.max(0, prev - 1));

        router.patch(
            `/notifications/${id}/read`,
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    if (isToast) toast.success('Notifikasi telah ditandai dibaca');
                    if (url && url !== '#' && url !== '') {
                        router.visit(url);
                    }
                },
            }
        );
    };

    const markAllAsRead = () => {
        setItems((prev) =>
            prev.map((n) => ({
                ...n,
                read_at: n.read_at || new Date().toISOString(),
            }))
        );
        setUnreadTotal(0);

        router.patch(
            '/notifications/read-all',
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    toast.success('Semua notifikasi telah ditandai dibaca');
                },
            }
        );
    };

    const hasUnread = unreadTotal > 0 || items.some((n) => n.read_at === null);

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <Head title="Riwayat Notifikasi" />

            {/* Header & Filter Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-2xl border border-border/80 shadow-xs">
                <div className="flex items-center gap-3.5">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                        <Bell className="size-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold tracking-tight text-foreground">
                                Riwayat Notifikasi
                            </h2>
                            {unreadTotal > 0 && (
                                <Badge className="bg-blue-600 hover:bg-blue-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                                    {unreadTotal} baru
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Menampilkan {items.length} dari {total} total notifikasi
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Filter Tabs */}
                    <div className="inline-flex items-center rounded-xl bg-muted/60 p-1 border border-border/60">
                        <button
                            type="button"
                            onClick={() => handleFilterChange('all')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                activeFilter === 'all'
                                    ? 'bg-background text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Semua
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterChange('unread')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                activeFilter === 'unread'
                                    ? 'bg-background text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Belum Dibaca
                            {unreadTotal > 0 && (
                                <span className="size-1.5 rounded-full bg-blue-600"></span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleFilterChange('read')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                activeFilter === 'read'
                                    ? 'bg-background text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            Sudah Dibaca
                        </button>
                    </div>

                    {/* Action Tandai Semua Dibaca */}
                    {hasUnread && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={markAllAsRead}
                            className="gap-2 text-xs font-medium cursor-pointer"
                        >
                            <CheckCheck className="size-4 text-blue-600" />
                            Tandai Semua Dibaca
                        </Button>
                    )}
                </div>
            </div>

            {/* Notification List Container */}
            <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
                {items.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <div className="size-14 rounded-full bg-muted/50 flex items-center justify-center mb-3 text-muted-foreground">
                            <Bell className="size-7 stroke-[1.5]" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">
                            {activeFilter === 'unread'
                                ? 'Tidak ada notifikasi yang belum dibaca'
                                : 'Belum ada notifikasi'}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                            {activeFilter === 'unread'
                                ? 'Bagus sekali! Semua notifikasi penting Anda telah diperiksa.'
                                : 'Anda akan melihat pemberitahuan terbaru terkait operasional, pesanan, dan keuangan di sini.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/60">
                        {items.map((notification) => {
                            const isUnread = notification.read_at === null;

                            return (
                                <div
                                    key={notification.id}
                                    className={`p-4 sm:p-5 flex gap-3.5 sm:gap-4 transition-all ${
                                        isUnread
                                            ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/60 dark:hover:bg-blue-950/30'
                                            : 'bg-card hover:bg-muted/40'
                                    }`}
                                >
                                    {/* Indicator Bullet / Icon */}
                                    <div className="shrink-0 mt-0.5">
                                        {isUnread ? (
                                            <div className="size-2.5 mt-1.5 rounded-full bg-blue-600 ring-4 ring-blue-500/20"></div>
                                        ) : (
                                            <div className="p-1.5 rounded-full bg-muted text-muted-foreground">
                                                <Info className="size-3.5" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 space-y-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                                            <h4
                                                className={`text-sm tracking-tight truncate ${
                                                    isUnread
                                                        ? 'font-bold text-foreground'
                                                        : 'font-medium text-foreground/80'
                                                }`}
                                            >
                                                {notification.data.title || 'Pemberitahuan Sistem'}
                                            </h4>
                                            <span
                                                className="flex items-center text-[11px] text-muted-foreground shrink-0 whitespace-nowrap"
                                                title={new Date(notification.created_at).toLocaleString('id-ID')}
                                            >
                                                <Clock className="size-3 mr-1 opacity-70" />
                                                {formatRelativeTime(notification.created_at)}
                                            </span>
                                        </div>

                                        <p
                                            className={`text-xs leading-relaxed line-clamp-3 ${
                                                isUnread
                                                    ? 'text-foreground/90 font-medium'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {notification.data.message ||
                                                'Anda memiliki pemberitahuan baru terkait aktivitas sistem.'}
                                        </p>

                                        {notification.data.url && (
                                            <div className="pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        markAsRead(notification.id, notification.data.url, false)
                                                    }
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline cursor-pointer"
                                                >
                                                    Lihat Detail
                                                    <ExternalLink className="size-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Mark As Read Button for individual unread items */}
                                    {isUnread && (
                                        <div className="shrink-0 flex items-center self-center pl-2">
                                            <button
                                                type="button"
                                                onClick={() => markAsRead(notification.id)}
                                                className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-100/60 dark:hover:bg-blue-950/60 rounded-full transition-colors cursor-pointer"
                                                title="Tandai telah dibaca"
                                            >
                                                <CheckCircle2 className="size-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* --- AUTO-SCROLL SENTINEL & LOADING STATE --- */}
                {currentPage < lastPage && !isPausedAtLimit && (
                    <div ref={sentinelRef} className="py-6 flex items-center justify-center gap-2 text-xs text-muted-foreground border-t border-border/40 bg-muted/20">
                        <Loader2 className="size-4 animate-spin text-primary" />
                        <span>Memuat notifikasi lainnya...</span>
                    </div>
                )}

                {/* --- CHECKPOINT: BATAS AUTO-SCROLL TERCAPAI (Limit & Threshold) --- */}
                {isPausedAtLimit && (
                    <div className="p-6 bg-muted/30 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                        <div className="space-y-1">
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                                <Layers className="size-4 text-primary" />
                                <h4 className="text-sm font-bold text-foreground">
                                    Batas Gulir Otomatis Tercapai
                                </h4>
                            </div>
                            <p className="text-xs text-muted-foreground max-w-lg">
                                Anda telah melihat <strong>{items.length}</strong> dari <strong>{total}</strong> notifikasi dalam sesi ini. 
                                Anda dapat melanjutkan gulir otomatis atau beralih langsung ke halaman lain.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleContinueAutoScroll}
                                className="gap-1.5 text-xs font-semibold cursor-pointer"
                            >
                                <ChevronDown className="size-4 text-primary" />
                                Muat Lebih Banyak
                            </Button>

                            <Button
                                size="sm"
                                onClick={() => {
                                    router.visit(`/notifications?page=${currentPage + 1}${activeFilter !== 'all' ? `&filter=${activeFilter}` : ''}`);
                                }}
                                className="gap-1.5 text-xs font-semibold cursor-pointer"
                            >
                                Halaman {currentPage + 1}
                                <ArrowRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* --- END OF LIST: SEMUA DATA TERCAPAI --- */}
                {currentPage >= lastPage && items.length > 0 && (
                    <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2 border-t border-border/40 bg-muted/10">
                        <CheckCircle2 className="size-4 text-emerald-500" />
                        <span>Semua notifikasi telah ditampilkan ({total} notifikasi)</span>
                    </div>
                )}
            </div>

            {/* --- PAGINATION CONTROLS (Selalu tersedia jika halaman > 1 untuk memudahkan navigasi manual) --- */}
            {lastPage > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <p className="text-xs text-muted-foreground text-center sm:text-left">
                        Halaman <strong>{currentPage}</strong> dari <strong>{lastPage}</strong> (Total <strong>{total}</strong> notifikasi)
                    </p>

                    <div className="flex flex-wrap gap-1 bg-card p-1 rounded-xl border border-border/80 shadow-xs">
                        {notifications.links.map((link, i) => {
                            if (!link.url) {
                                return (
                                    <span
                                        key={i}
                                        className="px-3 py-1.5 text-xs rounded-lg text-muted-foreground/40 cursor-not-allowed select-none"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            }

                            return (
                                <Link
                                    key={i}
                                    href={link.url}
                                    preserveScroll={false}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

Index.layout = (page: ReactNode) => (
    <AppLayout
        title="Riwayat Notifikasi"
        information="Personal · Inbox"
        description="Kelola dan pantau semua riwayat notifikasi Anda."
    >
        {page}
    </AppLayout>
);
