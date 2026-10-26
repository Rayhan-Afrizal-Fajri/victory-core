import React, { useState } from 'react';
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

export default function AccountingReports() {
    const [reportType, setReportType] = useState<'pnl' | 'balance_sheet' | 'cash_flow' | 'trial_balance'>('pnl');

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
                                        <div className="flex justify-between py-1">
                                            <span>4-1000 Pendapatan Penjualan Produksi Pakaian Jadi</span>
                                            <span className="font-mono font-medium">{formatCurrency(92100000)}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span>4-2000 Pendapatan Prototyping & Sample</span>
                                            <span className="font-mono font-medium">{formatCurrency(4800000)}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span>4-3000 Pendapatan Jasa Pengiriman & Ongkir</span>
                                            <span className="font-mono font-medium">{formatCurrency(1500000)}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-dashed pt-1.5 font-bold text-foreground">
                                            <span>TOTAL PENDAPATAN BERSIH:</span>
                                            <span className="font-mono">{formatCurrency(98400000)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION: HPP */}
                                <div>
                                    <h3 className="font-bold text-sm text-foreground uppercase border-b pb-1 mb-2">
                                        2. HARGA POKOK PENJUALAN (HPP / COGS)
                                    </h3>
                                    <div className="space-y-1.5 pl-3">
                                        <div className="flex justify-between py-1">
                                            <span>5-1100 Biaya Bahan Baku Utama (Kain)</span>
                                            <span className="font-mono">{formatCurrency(31200000)}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span>5-1200 Biaya Aksesoris & Trims (Kancing, Label)</span>
                                            <span className="font-mono">{formatCurrency(4800000)}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span>5-2000 Biaya Tenaga Kerja Langsung (Upah Borongan)</span>
                                            <span className="font-mono">{formatCurrency(12400000)}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span>5-3100 Biaya Makloon Sablon DTF & Manual</span>
                                            <span className="font-mono">{formatCurrency(5200000)}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span>5-3200 Biaya Makloon Bordir Komputer</span>
                                            <span className="font-mono">{formatCurrency(2100000)}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span>5-4000 Biaya Kerusakan, Cacat & Rework</span>
                                            <span className="font-mono">{formatCurrency(1200000)}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-dashed pt-1.5 font-bold text-rose-600">
                                            <span>TOTAL HARGA POKOK PENJUALAN:</span>
                                            <span className="font-mono">({formatCurrency(56900000)})</span>
                                        </div>
                                    </div>
                                </div>

                                {/* GROSS PROFIT */}
                                <div className="rounded-lg bg-emerald-500/10 p-3 flex justify-between font-bold text-sm text-emerald-800 dark:text-emerald-300">
                                    <span>LABA KOTOR (GROSS OPERATING PROFIT):</span>
                                    <span className="font-mono">{formatCurrency(41500000)} (Margin: 42.2%)</span>
                                </div>

                                {/* SECTION: BEBAN OPERASIONAL */}
                                <div>
                                    <h3 className="font-bold text-sm text-foreground uppercase border-b pb-1 mb-2">
                                        3. BEBAN OPERASIONAL (OPEX)
                                    </h3>
                                    <div className="space-y-1.5 pl-3">
                                        <div className="flex justify-between py-1">
                                            <span>6-1000 Beban Gaji Staf Tetap & Admin QC</span>
                                            <span className="font-mono">{formatCurrency(8500000)}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span>6-2000 Beban Sewa Workshop Pabrik</span>
                                            <span className="font-mono">{formatCurrency(3500000)}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span>6-3000 Beban Listrik Industri & Internet</span>
                                            <span className="font-mono">{formatCurrency(2100000)}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span>6-5000 Beban Pemeliharaan & Jarum Mesin</span>
                                            <span className="font-mono">{formatCurrency(900000)}</span>
                                        </div>
                                        <div className="flex justify-between py-1">
                                            <span>6-7000 Beban ATK & Konsumsi Workshop</span>
                                            <span className="font-mono">{formatCurrency(1200000)}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-dashed pt-1.5 font-bold text-foreground">
                                            <span>TOTAL BEBAN OPERASIONAL:</span>
                                            <span className="font-mono text-rose-600">({formatCurrency(16200000)})</span>
                                        </div>
                                    </div>
                                </div>

                                {/* NET PROFIT */}
                                <div className="rounded-lg bg-primary/10 border-2 border-primary/30 p-4 flex justify-between font-bold text-base text-foreground">
                                    <span className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        LABA BERSIH BULAN INI (NET PROFIT):
                                    </span>
                                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(25300000)}
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
                                        <p className="font-semibold text-primary">Aset Lancar</p>
                                        <div className="space-y-1 pl-2">
                                            <div className="flex justify-between">
                                                <span>1-1110 Kas Operasional Pabrik</span>
                                                <span className="font-mono">{formatCurrency(8500000)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>1-1120 Bank BCA Operasional</span>
                                                <span className="font-mono">{formatCurrency(74200000)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>1-1130 Bank Mandiri Penerimaan</span>
                                                <span className="font-mono">{formatCurrency(35800000)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>1-1210 Piutang Usaha Produksi</span>
                                                <span className="font-mono">{formatCurrency(28400000)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>1-1220 Piutang Sample</span>
                                                <span className="font-mono">{formatCurrency(2600000)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>1-1310 Persediaan Bahan Baku</span>
                                                <span className="font-mono">{formatCurrency(14800000)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>1-1320 Persediaan Aksesoris</span>
                                                <span className="font-mono">{formatCurrency(4200000)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>1-1330 Barang Dalam Proses (WIP)</span>
                                                <span className="font-mono">{formatCurrency(4000000)}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-1 font-semibold text-foreground">
                                                <span>Total Aset Lancar:</span>
                                                <span className="font-mono">{formatCurrency(172500000)}</span>
                                            </div>
                                        </div>

                                        <p className="font-semibold text-primary pt-2">Aset Tetap</p>
                                        <div className="space-y-1 pl-2">
                                            <div className="flex justify-between">
                                                <span>Mesin Pabrik (Jahit, Obras, Cutting)</span>
                                                <span className="font-mono">{formatCurrency(125000000)}</span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Akumulasi Penyusutan Mesin</span>
                                                <span className="font-mono">({formatCurrency(22000000)})</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Peralatan Kantor & Komputer</span>
                                                <span className="font-mono">{formatCurrency(15000000)}</span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>Akumulasi Penyusutan Kantor</span>
                                                <span className="font-mono">({formatCurrency(6000000)})</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-1 font-semibold text-foreground">
                                                <span>Total Aset Tetap:</span>
                                                <span className="font-mono">{formatCurrency(112000000)}</span>
                                            </div>
                                        </div>

                                        <div className="rounded-lg bg-blue-500/10 p-3 flex justify-between font-bold text-sm text-blue-900 dark:text-blue-200 border border-blue-500/20">
                                            <span>TOTAL ASET (AKTIVA):</span>
                                            <span className="font-mono">{formatCurrency(284500000)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT: KEWAJIBAN & EKUITAS */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-sm text-foreground uppercase border-b pb-1">
                                        KEWAJIBAN & EKUITAS (PASIVA)
                                    </h3>
                                    <div className="space-y-2">
                                        <p className="font-semibold text-primary">Kewajiban Jangka Pendek</p>
                                        <div className="space-y-1 pl-2">
                                            <div className="flex justify-between">
                                                <span>2-1110 Hutang Supplier Bahan Baku</span>
                                                <span className="font-mono">{formatCurrency(18500000)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>2-1120 Hutang Supplier Aksesoris</span>
                                                <span className="font-mono">{formatCurrency(3200000)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>2-1130 Hutang Vendor Makloon</span>
                                                <span className="font-mono">{formatCurrency(6400000)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>2-1210 Uang Muka DP Pesanan</span>
                                                <span className="font-mono">{formatCurrency(14200000)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>2-1310 Hutang Upah Borongan Worker</span>
                                                <span className="font-mono">{formatCurrency(4400000)}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-1 font-semibold text-foreground">
                                                <span>Total Kewajiban:</span>
                                                <span className="font-mono">{formatCurrency(46700000)}</span>
                                            </div>
                                        </div>

                                        <p className="font-semibold text-primary pt-2">Ekuitas & Modal</p>
                                        <div className="space-y-1 pl-2">
                                            <div className="flex justify-between">
                                                <span>3-1000 Modal Disetor Pemilik</span>
                                                <span className="font-mono">{formatCurrency(180000000)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>3-2000 Laba Ditahan (Retained Earnings)</span>
                                                <span className="font-mono">{formatCurrency(32500000)}</span>
                                            </div>
                                            <div className="flex justify-between text-emerald-600 font-medium">
                                                <span>3-3000 Laba Periode Berjalan</span>
                                                <span className="font-mono">{formatCurrency(25300000)}</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-1 font-semibold text-foreground">
                                                <span>Total Ekuitas:</span>
                                                <span className="font-mono">{formatCurrency(237800000)}</span>
                                            </div>
                                        </div>

                                        <div className="rounded-lg bg-blue-500/10 p-3 flex justify-between font-bold text-sm text-blue-900 dark:text-blue-200 border border-blue-500/20">
                                            <span>TOTAL PASIVA:</span>
                                            <span className="font-mono">{formatCurrency(284500000)}</span>
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
                                        {mockCOA.filter(c => !c.isHeader).map((acc) => (
                                            <tr key={acc.code} className="hover:bg-muted/20">
                                                <td className="p-2.5 font-mono font-medium">{acc.code}</td>
                                                <td className="p-2.5">{acc.name}</td>
                                                <td className="p-2.5 text-right font-mono text-emerald-700 dark:text-emerald-400">
                                                    {acc.normalBalance === 'debit' ? formatCurrency(Math.abs(acc.balance)) : '-'}
                                                </td>
                                                <td className="p-2.5 text-right font-mono text-blue-700 dark:text-blue-400">
                                                    {acc.normalBalance === 'credit' ? formatCurrency(Math.abs(acc.balance)) : '-'}
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
