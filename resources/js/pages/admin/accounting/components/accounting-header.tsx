import { Link, usePage } from '@inertiajs/react';
import {
    Calculator,
    BookOpen,
    FileText,
    Target,
    ArrowDownLeft,
    ArrowUpRight,
    Wallet,
    FileSpreadsheet,
    Sparkles,
    Calendar,
    Download,
    Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AccountingHeaderProps {
    activeTab: 'overview' | 'coa' | 'journals' | 'costing' | 'receivables' | 'payables' | 'expenses' | 'reports';
    onQuickAction?: (action: string) => void;
}

export function AccountingHeader({ activeTab, onQuickAction }: AccountingHeaderProps) {
    const tabs = [
        { id: 'overview', label: 'Ringkasan', href: '/admin/accounting', icon: Calculator },
        { id: 'coa', label: 'Bagan Akun (COA)', href: '/admin/accounting/coa', icon: BookOpen },
        { id: 'journals', label: 'Jurnal & Buku Besar', href: '/admin/accounting/journals', icon: FileText },
        { id: 'costing', label: 'Job Order Costing (HPP)', href: '/admin/accounting/costing', icon: Target },
        { id: 'receivables', label: 'Piutang (AR)', href: '/admin/accounting/receivables', icon: ArrowDownLeft },
        { id: 'payables', label: 'Hutang (AP)', href: '/admin/accounting/payables', icon: ArrowUpRight },
        { id: 'expenses', label: 'Kas & OPEX', href: '/admin/accounting/expenses', icon: Wallet },
        { id: 'reports', label: 'Laporan Keuangan', href: '/admin/accounting/reports', icon: FileSpreadsheet },
    ];

    return (
        <div className="space-y-4">
            {/* STAGE 2 BANNER */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-primary/5 p-4 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-foreground">Modul Akuntansi Terpadu (Stage 2)</h2>
                            <Badge variant="outline" className="border-primary/40 bg-primary/15 text-xs text-primary font-semibold">
                                UI/UX Interactive Prototype
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Sistem Akuntansi Garment Double-Entry Bookkeeping & Real-time Job Order Costing
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 rounded-lg border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-xs">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        <span>Periode: <strong>Oktober 2026</strong></span>
                    </div>
                    {onQuickAction && (
                        <Button
                            size="sm"
                            className="gap-1.5 cursor-pointer shadow-xs"
                            onClick={() => onQuickAction('new_journal')}
                        >
                            <Plus className="h-4 w-4" />
                            <span>Jurnal Baru</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-1 overflow-x-auto border-b pb-2 pt-1 scrollbar-none">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                                isActive
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{tab.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
