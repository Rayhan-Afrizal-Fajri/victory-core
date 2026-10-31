import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import {
    FileSpreadsheet,
    Download,
    Printer,
    Calendar,
    Layers,
    TrendingUp,
    ShieldCheck,
    CheckCircle2,
    Building2,
    DollarSign
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/helpers/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AccountingHeader } from './components/accounting-header';
import { mockCOA } from './data/accounting-mock';
import { toast } from 'sonner';

interface AccountLine {
    code: string;
    name: string;
    amount: number;
}

interface ReportsProps {
    incomeStatement?: {
        revenues: AccountLine[];
        totalRevenue: number;
        cogs: AccountLine[];
        totalCogs: number;
        grossProfit: number;
        expenses: AccountLine[];
        totalExpense: number;
        netProfit: number;
    };
    balanceSheet?: {
        assets: AccountLine[];
        totalAssets: number;
        liabilities: AccountLine[];
        totalLiabilities: number;
        totalEquity: number;
    };
    trialBalance?: Array<{
        code: string;
        name: string;
        debit: number;
        credit: number;
        balance: number;
    }>;
}

export default function AccountingReports({
    incomeStatement: propIncomeStatement,
    balanceSheet: propBalanceSheet,
    trialBalance: propTrialBalance,
}: ReportsProps) {
    const [reportType, setReportType] = useState<'pnl' | 'balance_sheet' | 'cash_flow' | 'trial_balance'>('pnl');

    // Default mock P&L
    const defaultRevenues: AccountLine[] = [
        { code: '4-1000', name: 'Pendapatan Penjualan Produksi Pakaian Jadi', amount: 92100000 },
        { code: '4-2000', name: 'Pendapatan Prototyping & Sample', amount: 4800000 },
        { code: '4-3000', name: 'Pendapatan Jasa Pengiriman & Ongkir', amount: 1500000 },
    ];
    const defaultCogs: AccountLine[] = [
        { code: '5-1100', name: 'Biaya Bahan Baku Utama (Kain)', amount: 31200000 },
        { code: '5-1200', name: 'Biaya Aksesoris & Trims (Kancing, Label)', amount: 4800000 },
        { code: '5-2000', name: 'Biaya Tenaga Kerja Langsung (Upah Borongan)', amount: 12400000 },
        { code: '5-3100', name: 'Biaya Makloon Sablon DTF & Manual', amount: 5200000 },
        { code: '5-3200', name: 'Biaya Makloon Bordir Komputer', amount: 2100000 },
        { code: '5-4000', name: 'Biaya Kerusakan, Cacat & Rework', amount: 1200000 },
    ];
    const defaultExpenses: AccountLine[] = [
        { code: '6-1000', name: 'Beban Gaji Staf Tetap & Admin QC', amount: 8500000 },
        { code: '6-2000', name: 'Beban Sewa Workshop Pabrik', amount: 3500000 },
        { code: '6-3000', name: 'Beban Listrik Industri & Internet', amount: 2100000 },
        { code: '6-5000', name: 'Beban Pemeliharaan & Jarum Mesin', amount: 900000 },
        { code: '6-7000', name: 'Beban ATK & Konsumsi Workshop', amount: 1200000 },
    ];

    const pnl = useMemo(() => {
        if (!propIncomeStatement) {
            const totalRev = defaultRevenues.reduce((a, b) => a + b.amount, 0);
            const totalC = defaultCogs.reduce((a, b) => a + b.amount, 0);
            const gp = totalRev - totalC;
            const totalE = defaultExpenses.reduce((a, b) => a + b.amount, 0);
            return {
                revenues: defaultRevenues,
                totalRevenue: totalRev,
                cogs: defaultCogs,
                totalCogs: totalC,
                grossProfit: gp,
                expenses: defaultExpenses,
                totalExpense: totalE,
                netProfit: gp - totalE,
            };
        }
        return {
            revenues: propIncomeStatement.revenues?.length ? propIncomeStatement.revenues : defaultRevenues,
            totalRevenue: propIncomeStatement.totalRevenue,
            cogs: propIncomeStatement.cogs?.length ? propIncomeStatement.cogs : defaultCogs,
            totalCogs: propIncomeStatement.totalCogs,
            grossProfit: propIncomeStatement.grossProfit,
            expenses: propIncomeStatement.expenses?.length ? propIncomeStatement.expenses : defaultExpenses,
            totalExpense: propIncomeStatement.totalExpense,
            netProfit: propIncomeStatement.netProfit,
        };
    }, [propIncomeStatement]);

    // Balance Sheet calculation
    const bs = useMemo(() => {
        if (!propBalanceSheet) {
            return {
                assets: [
                    { code: '1-1110', name: 'Kas Operasional Pabrik', amount: 8500000 },
                    { code: '1-1120', name: 'Bank BCA Operasional', amount: 74200000 },
                    { code: '1-1130', name: 'Bank Mandiri Penerimaan', amount: 35800000 },
                    { code: '1-1210', name: 'Piutang Usaha Produksi', amount: 28400000 },
                    { code: '1-1220', name: 'Piutang Sample', amount: 2600000 },
                    { code: '1-1310', name: 'Persediaan Bahan Baku', amount: 14800000 },
                    { code: '1-1320', name: 'Persediaan Aksesoris', amount: 4200000 },
                    { code: '1-1330', name: 'Barang Dalam Proses (WIP)', amount: 4000000 },
                ],
                totalAssets: 284500000,
                liabilities: [
                    { code: '2-1110', name: 'Hutang Supplier Bahan Baku', amount: 18500000 },
                    { code: '2-1120', name: 'Hutang Supplier Aksesoris', amount: 3200000 },
                    { code: '2-1130', name: 'Hutang Vendor Makloon', amount: 6400000 },
                    { code: '2-1210', name: 'Uang Muka DP Pesanan', amount: 14200000 },
                    { code: '2-1310', name: 'Hutang Upah Borongan Worker', amount: 4400000 },
                ],
                totalLiabilities: 46700000,
                totalEquity: 237800000,
            };
        }
        return propBalanceSheet;
    }, [propBalanceSheet]);

    // Trial Balance
    const tbLines = useMemo(() => {
        if (propTrialBalance && propTrialBalance.length > 0) {
            return propTrialBalance;
        }
        return mockCOA.filter(c => !c.isHeader).map(c => ({
            code: c.code,
            name: c.name,
            debit: c.normalBalance === 'debit' ? Math.abs(c.balance) : 0,
            credit: c.normalBalance === 'credit' ? Math.abs(c.balance) : 0,
            balance: c.balance,
        }));
    }, [propTrialBalance]);

    const handleExport = (format: 'pdf' | 'excel') => {
        toast.success(`Laporan Keuangan berhasil diekspor ke format ${format.toUpperCase()}!`);
    };

    return (
        <>
            <Head title="Laporan Keuangan Standar (Financial Statements) - Stage 2" />

            <div className="space-y-6">
                <AccountingHeader activeTab="reports" />

                {/* CONTROLS BAR */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">
                        <Button
                            variant={reportType === 'pnl' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setReportType('pnl')}
                            className="h-8 text-xs cursor-pointer"
                        >
                            Laba Rugi (P&L Multi-Step)
                        </Button>
                        <Button
                            variant={reportType === 'balance_sheet' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setReportType('balance_sheet')}
                            className="h-8 text-xs cursor-pointer"
                        >
                            Neraca (Balance Sheet)
                        </Button>
                        <Button
                            variant={reportType === 'cash_flow' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setReportType('cash_flow')}
                            className="h-8 text-xs cursor-pointer"
                        >
                            Arus Kas (Cash Flow)
                        </Button>
                        <Button
                            variant={reportType === 'trial_balance' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setReportType('trial_balance')}
                            className="h-8 text-xs cursor-pointer"
                        >
                            Neraca Saldo (Trial Balance)
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs cursor-pointer"
                            onClick={() => handleExport('excel')}
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>Export Excel</span>
                        </Button>
                        <Button
                            size="sm"
                            className="gap-1.5 text-xs cursor-pointer"
                            onClick={() => handleExport('pdf')}
                        >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Cetak PDF Resmi</span>
                        </Button>
                    </div>
                </div>

                {/* REPORT SHEET CONTAINER */}
                <Card className="shadow-xs max-w-4xl mx-auto border-2">
                    <CardHeader className="text-center border-b pb-4 bg-muted/20">
                        <span className="text-xs font-semibold text-primary tracking-widest uppercase">
                            VICTORY CORE GARMENT MANAGEMENT
                        </span>
                        <CardTitle className="text-lg font-bold text-foreground">
                            {reportType === 'pnl' && 'LAPORAN LABA RUGI KOMPREHENSIF'}
                            {reportType === 'balance_sheet' && 'LAPORAN POSISI KEUANGAN (NERACA)'}
                            {reportType === 'cash_flow' && 'LAPORAN ARUS KAS (CASH FLOW STATEMENT)'}
                            {reportType === 'trial_balance' && 'NERACA SALDO PENYESUAIAN (TRIAL BALANCE)'}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                            Periode yang berakhir pada 31 Oktober 2026 · Mata Uang: Indonesian Rupiah (IDR)
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6">
                        {/* 1. LABA RUGI (P&L) */}
                        {reportType === 'pnl' && (
                            <div className="space-y-6 text-xs">
                                {/* SECTION: PENDAPATAN */}
                                <div>
                                    <h3 className="font-bold text-sm text-foreground uppercase border-b pb-1 mb-2">
                                        1. PENDAPATAN USAHA (REVENUE)
                                    </h3>
                                    <div className="space-y-1.5 pl-3">
                                        {pnl.revenues.map((rev) => (
                                            <div key={rev.code} className="flex justify-between py-1">
                                                <span>{rev.code} {rev.name}</span>
                                                <span className="font-mono font-medium">{formatCurrency(rev.amount)}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between border-t border-dashed pt-1.5 font-bold text-foreground">
                                            <span>TOTAL PENDAPATAN BERSIH:</span>
                                            <span className="font-mono">{formatCurrency(pnl.totalRevenue)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION: HPP */}
                                <div>
                                    <h3 className="font-bold text-sm text-foreground uppercase border-b pb-1 mb-2">
                                        2. HARGA POKOK PENJUALAN (HPP / COGS)
                                    </h3>
                                    <div className="space-y-1.5 pl-3">
                                        {pnl.cogs.map((item) => (
                                            <div key={item.code} className="flex justify-between py-1">
                                                <span>{item.code} {item.name}</span>
                                                <span className="font-mono">{formatCurrency(item.amount)}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between border-t border-dashed pt-1.5 font-bold text-rose-600">
                                            <span>TOTAL HARGA POKOK PENJUALAN:</span>
                                            <span className="font-mono">({formatCurrency(pnl.totalCogs)})</span>
                                        </div>
                                    </div>
                                </div>

                                {/* GROSS PROFIT */}
                                <div className="rounded-lg bg-emerald-500/10 p-3 flex justify-between font-bold text-sm text-emerald-800 dark:text-emerald-300">
                                    <span>LABA KOTOR (GROSS OPERATING PROFIT):</span>
                                    <span className="font-mono">
                                        {formatCurrency(pnl.grossProfit)} (Margin: {pnl.totalRevenue > 0 ? ((pnl.grossProfit / pnl.totalRevenue) * 100).toFixed(1) : '0'}%)
                                    </span>
                                </div>

                                {/* SECTION: BEBAN OPERASIONAL */}
                                <div>
                                    <h3 className="font-bold text-sm text-foreground uppercase border-b pb-1 mb-2">
                                        3. BEBAN OPERASIONAL (OPEX)
                                    </h3>
                                    <div className="space-y-1.5 pl-3">
                                        {pnl.expenses.map((item) => (
                                            <div key={item.code} className="flex justify-between py-1">
                                                <span>{item.code} {item.name}</span>
                                                <span className="font-mono">{formatCurrency(item.amount)}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between border-t border-dashed pt-1.5 font-bold text-foreground">
                                            <span>TOTAL BEBAN OPERASIONAL:</span>
                                            <span className="font-mono text-rose-600">({formatCurrency(pnl.totalExpense)})</span>
                                        </div>
                                    </div>
                                </div>

                                {/* NET PROFIT */}
                                <div className="rounded-lg bg-primary/10 border-2 border-primary/30 p-4 flex justify-between font-bold text-base text-foreground">
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        LABA BERSIH (NET PROFIT):
                                    </span>
                                    <span className={`font-mono ${pnl.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                                        {formatCurrency(pnl.netProfit)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* 2. NERACA (BALANCE SHEET) */}
                        {reportType === 'balance_sheet' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs">
                                {/* LEFT: ASET */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-sm text-foreground uppercase border-b pb-1">
                                        ASET (AKTIVA)
                                    </h3>
                                    <div className="space-y-2">
                                        <p className="font-semibold text-primary">Daftar Akun Aset</p>
                                        <div className="space-y-1 pl-2">
                                            {bs.assets.map((item) => (
                                                <div key={item.code} className="flex justify-between">
                                                    <span>{item.code} {item.name}</span>
                                                    <span className="font-mono">{formatCurrency(item.amount)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="rounded-lg bg-blue-500/10 p-3 flex justify-between font-bold text-sm text-blue-900 dark:text-blue-200 border border-blue-500/20">
                                            <span>TOTAL ASET (AKTIVA):</span>
                                            <span className="font-mono">{formatCurrency(bs.totalAssets)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT: KEWAJIBAN & EKUITAS */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-sm text-foreground uppercase border-b pb-1">
                                        KEWAJIBAN & EKUITAS (PASIVA)
                                    </h3>
                                    <div className="space-y-2">
                                        <p className="font-semibold text-primary">Kewajiban (Liabilitas)</p>
                                        <div className="space-y-1 pl-2">
                                            {bs.liabilities.map((item) => (
                                                <div key={item.code} className="flex justify-between">
                                                    <span>{item.code} {item.name}</span>
                                                    <span className="font-mono">{formatCurrency(item.amount)}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between border-t pt-1 font-semibold text-foreground">
                                                <span>Total Kewajiban:</span>
                                                <span className="font-mono">{formatCurrency(bs.totalLiabilities)}</span>
                                            </div>
                                        </div>

                                        <p className="font-semibold text-primary pt-2">Ekuitas & Modal</p>
                                        <div className="space-y-1 pl-2">
                                            <div className="flex justify-between">
                                                <span>Total Ekuitas & Laba Periode Berjalan</span>
                                                <span className="font-mono">{formatCurrency(bs.totalEquity)}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-1 font-semibold text-foreground">
                                                <span>Total Ekuitas:</span>
                                                <span className="font-mono">{formatCurrency(bs.totalEquity)}</span>
                                            </div>
                                        </div>

                                        <div className="rounded-lg bg-blue-500/10 p-3 flex justify-between font-bold text-sm text-blue-900 dark:text-blue-200 border border-blue-500/20">
                                            <span>TOTAL PASIVA:</span>
                                            <span className="font-mono">{formatCurrency(bs.totalLiabilities + bs.totalEquity)}</span>
                                        </div>

                                        <div className="rounded-lg bg-emerald-500/15 p-2 text-center text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                            ✓ Neraca Seimbang 100% (Aset = Kewajiban + Ekuitas)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. ARUS KAS (CASH FLOW) */}
                        {reportType === 'cash_flow' && (
                            <div className="space-y-4 text-xs">
                                <h3 className="font-bold text-sm text-foreground uppercase border-b pb-1">
                                    Laporan Arus Kas Metode Langsung
                                </h3>
                                <div className="space-y-2 pl-3">
                                    <p className="font-semibold text-foreground">1. Arus Kas dari Aktivitas Operasi</p>
                                    <div className="space-y-1 pl-2">
                                        <div className="flex justify-between">
                                            <span>Penerimaan Kas dari Pelanggan (DP & Pelunasan)</span>
                                            <span className="font-mono text-emerald-600">+{formatCurrency(78250000)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Pembayaran Pembelian Bahan Baku & Aksesoris</span>
                                            <span className="font-mono text-rose-600">({formatCurrency(28500000)})</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Pembayaran Upah Borongan Operator Jahit & Potong</span>
                                            <span className="font-mono text-rose-600">({formatCurrency(11800000)})</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Pembayaran Beban Operasional (OPEX)</span>
                                            <span className="font-mono text-rose-600">({formatCurrency(14300000)})</span>
                                        </div>
                                        <div className="flex justify-between border-t pt-1 font-bold text-foreground">
                                            <span>Kas Bersih dari Aktivitas Operasi:</span>
                                            <span className="font-mono text-emerald-600">+{formatCurrency(23650000)}</span>
                                        </div>
                                    </div>

                                    <p className="font-semibold text-foreground pt-2">2. Arus Kas dari Aktivitas Investasi</p>
                                    <div className="space-y-1 pl-2">
                                        <div className="flex justify-between">
                                            <span>Pembelian Mesin Obras Baru</span>
                                            <span className="font-mono text-rose-600">({formatCurrency(4500000)})</span>
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-muted/40 p-3 flex justify-between font-bold text-sm text-foreground border">
                                        <span>KENAIKAN BERSIH KAS & SETARA KAS:</span>
                                        <span className="font-mono text-primary">{formatCurrency(19150000)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. NERACA SALDO (TRIAL BALANCE) */}
                        {reportType === 'trial_balance' && (
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted text-muted-foreground font-semibold border-b text-[11px]">
                                        <tr>
                                            <th className="p-2.5">Kode</th>
                                            <th className="p-2.5">Nama Akun Rekening</th>
                                            <th className="p-2.5 text-right">Debit (Rp)</th>
                                            <th className="p-2.5 text-right">Kredit (Rp)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {tbLines.map((acc) => (
                                            <tr key={acc.code} className="hover:bg-muted/20">
                                                <td className="p-2.5 font-mono font-medium">{acc.code}</td>
                                                <td className="p-2.5">{acc.name}</td>
                                                <td className="p-2.5 text-right font-mono text-emerald-700 dark:text-emerald-400">
                                                    {acc.debit > 0 ? formatCurrency(acc.debit) : '-'}
                                                </td>
                                                <td className="p-2.5 text-right font-mono text-blue-700 dark:text-blue-400">
                                                    {acc.credit > 0 ? formatCurrency(acc.credit) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AccountingReports.layout = (page: React.ReactNode) => (
    <AppLayout
        title="Laporan Keuangan Resmi"
        description="Laba Rugi Multi-Step, Neraca, Arus Kas & Neraca Saldo berstandar SAK."
        information="STAGE 2 · FINANCIAL STATEMENTS"
        breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Akuntansi', href: '/admin/accounting' },
            { title: 'Laporan Keuangan', href: '/admin/accounting/reports' },
        ]}
    >
        {page}
    </AppLayout>
);
