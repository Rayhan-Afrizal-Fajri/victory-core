import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import {
    ArrowDownLeft,
    Clock,
    AlertCircle,
    Calendar,
    Search,
    Download,
    Mail,
    FileText,
    CheckCircle2,
    DollarSign,
    ExternalLink
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/helpers/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AccountingHeader } from './components/accounting-header';
import { mockReceivables, ReceivableItem } from './data/accounting-mock';
import { toast } from 'sonner';

interface ReceivableProps {
    receivables?: any[];
    summary?: {
        totalAR: number;
        totalPaid: number;
        current: number;
        aging1_30: number;
        aging31_60: number;
        aging61_90: number;
        agingOver90: number;
    };
}

export default function AccountingReceivables({ receivables: propReceivables, summary }: ReceivableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatementCustomer, setSelectedStatementCustomer] = useState<any | null>(null);

    const items = useMemo(() => {
        if (!propReceivables || propReceivables.length === 0) {
            return mockReceivables;
        }
        return propReceivables.map((r) => ({
            id: r.id,
            invoiceNo: r.invoiceNumber,
            jobTicketNo: r.jobTicketNo,
            customer: r.customerName,
            invoiceDate: r.issueDate,
            dueDate: r.dueDate,
            daysOverdue: r.daysOverdue,
            totalAmount: r.totalAmount,
            paidAmount: r.paidAmount,
            remainingAmount: r.remainingAmount,
            agingBucket: r.aging === 'current' ? 'current' : (r.aging === '1_30_days' ? '1-30' : (r.aging === '31_60_days' ? '31-60' : (r.aging === '61_90_days' ? '61-90' : '>90'))),
            status: r.status,
            contactPhone: '0812-xxxx-xxxx',
        }));
    }, [propReceivables]);

    const filteredAR = items.filter((ar: any) =>
        ar.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ar.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ar.jobTicketNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Aging Buckets Calculation
    const totalCurrent = summary ? summary.current : items.filter((r: any) => r.agingBucket === 'current').reduce((a: number, c: any) => a + c.remainingAmount, 0);
    const total1to30 = summary ? summary.aging1_30 : items.filter((r: any) => r.agingBucket === '1-30').reduce((a: number, c: any) => a + c.remainingAmount, 0);
    const total31to60 = summary ? summary.aging31_60 : items.filter((r: any) => r.agingBucket === '31-60').reduce((a: number, c: any) => a + c.remainingAmount, 0);
    const totalAbove60 = summary ? (summary.aging61_90 + summary.agingOver90) : items.filter((r: any) => r.agingBucket === '61-90' || r.agingBucket === '>90').reduce((a: number, c: any) => a + c.remainingAmount, 0);
    const totalReceivables = summary ? summary.totalAR : items.reduce((a: number, c: any) => a + c.remainingAmount, 0);

    const handleSendReminder = (customer: string) => {
        toast.success(`Pengingat tagihan (WhatsApp & Email) berhasil dikirim ke ${customer}`);
    };

    return (
        <>
            <Head title="Piutang Usaha & Aging Schedule (AR) - Stage 2" />

            <div className="space-y-6">
                <AccountingHeader activeTab="receivables" />

                {/* AGING SCHEDULE BUCKET CARDS */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {/* TOTAL AR */}
                    <Card className="border-l-4 border-l-blue-600 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Total Sisa Piutang</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold font-mono text-foreground">
                                {formatCurrency(totalReceivables)}
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">4 Pelanggan Aktif</p>
                        </CardContent>
                    </Card>

                    {/* CURRENT (BELUM JATUH TEMPO) */}
                    <Card className="border-l-4 border-l-emerald-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Lancar (Current)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold font-mono text-emerald-600">
                                {formatCurrency(totalCurrent)}
                            </div>
                            <p className="mt-1 text-[11px] text-muted-foreground">Belum jatuh tempo</p>
                        </CardContent>
                    </Card>

                    {/* 1 - 30 HARI */}
                    <Card className="border-l-4 border-l-amber-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">1 - 30 Hari</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold font-mono text-amber-600">
                                {formatCurrency(total1to30)}
                            </div>
                            <p className="mt-1 text-[11px] text-amber-600 font-medium">Jatuh tempo ringan</p>
                        </CardContent>
                    </Card>

                    {/* 31 - 60 HARI */}
                    <Card className="border-l-4 border-l-orange-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">31 - 60 Hari</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold font-mono text-orange-600">
                                {formatCurrency(total31to60)}
                            </div>
                            <p className="mt-1 text-[11px] text-orange-600 font-medium">Perlu penagihan aktif</p>
                        </CardContent>
                    </Card>

                    {/* > 60 HARI */}
                    <Card className="border-l-4 border-l-rose-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">&gt; 60 Hari (Kritis)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold font-mono text-rose-600">
                                {formatCurrency(totalAbove60)}
                            </div>
                            <p className="mt-1 text-[11px] text-rose-600 font-medium">Risiko piutang ragu</p>
                        </CardContent>
                    </Card>
                </div>

                {/* SEARCH & CONTROLS */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari invoice, pelanggan, nomor PO..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs cursor-pointer"
                            onClick={() => toast.success('Laporan Aging Piutang (AR Schedule) berhasil diekspor!')}
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>Export Aging AR</span>
                        </Button>
                    </div>
                </div>

                {/* RECEIVABLES TABLE */}
                <Card className="shadow-xs">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Buku Pembantu Piutang (Sub-Ledger AR per Pelanggan)</CardTitle>
                        <CardDescription className="text-xs">
                            Riwayat seluruh faktur yang belum lunas beserta batas tempo dan sisa tagihan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/60 text-muted-foreground font-medium border-b text-[11px]">
                                    <tr>
                                        <th className="p-3">No. Invoice & PO</th>
                                        <th className="p-3">Pelanggan</th>
                                        <th className="p-3">Tgl Terbit</th>
                                        <th className="p-3">Jatuh Tempo</th>
                                        <th className="p-3 text-right">Total Tagihan</th>
                                        <th className="p-3 text-right">Sudah Dibayar</th>
                                        <th className="p-3 text-right font-bold">Sisa Piutang</th>
                                        <th className="p-3 text-center">Status / Aging</th>
                                        <th className="p-3 text-center w-32.5">Aksi Penagihan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredAR.map((item) => (
                                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="p-3 font-medium">
                                                <span className="font-semibold text-primary font-mono">{item.invoiceNo}</span>
                                                <div className="text-[11px] text-muted-foreground font-mono">{item.jobTicketNo}</div>
                                            </td>
                                            <td className="p-3 text-foreground font-medium">{item.customer}</td>
                                            <td className="p-3 text-muted-foreground font-mono">{item.invoiceDate}</td>
                                            <td className="p-3 font-mono font-medium text-foreground">
                                                {item.dueDate}
                                                {item.daysOverdue > 0 && (
                                                    <span className="block text-[10px] text-rose-600 font-semibold">
                                                        Lewat {item.daysOverdue} Hari
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-right font-mono text-muted-foreground">
                                                {formatCurrency(item.totalAmount)}
                                            </td>
                                            <td className="p-3 text-right font-mono text-emerald-600">
                                                {formatCurrency(item.paidAmount)}
                                            </td>
                                            <td className="p-3 text-right font-mono font-bold text-foreground">
                                                {formatCurrency(item.remainingAmount)}
                                            </td>
                                            <td className="p-3 text-center">
                                                {item.status === 'overdue' ? (
                                                    <Badge variant="destructive" className="text-[10px] uppercase font-semibold">
                                                        Lewat Tempo ({item.agingBucket})
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                                                        Current / Lancar
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-[11px] px-2 gap-1 cursor-pointer"
                                                        onClick={() => setSelectedStatementCustomer(item)}
                                                    >
                                                        <FileText className="h-3 w-3" /> Rekening Koran
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-primary hover:bg-primary/10 cursor-pointer"
                                                        onClick={() => handleSendReminder(item.customer)}
                                                        title="Kirim Reminder Tagihan"
                                                    >
                                                        <Mail className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* MODAL STATEMENT OF ACCOUNT / REKENING KORAN PIUTANG */}
                <Dialog open={!!selectedStatementCustomer} onOpenChange={() => setSelectedStatementCustomer(null)}>
                    <DialogContent className="sm:max-w-145">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold flex items-center justify-between">
                                <span>Statement of Account (Rekening Koran)</span>
                                <Badge variant="outline" className="text-xs">
                                    {selectedStatementCustomer?.customer}
                                </Badge>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Laporan rincian invoice dan riwayat penerimaan kas pelanggan untuk konfirmasi tagihan.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedStatementCustomer && (
                            <div className="space-y-4 py-2 text-xs">
                                <div className="rounded-lg border p-3 bg-muted/20 flex justify-between items-center">
                                    <div>
                                        <p className="text-muted-foreground text-[11px]">Invoice Aktif</p>
                                        <p className="font-mono font-bold text-foreground text-sm">{selectedStatementCustomer.invoiceNo}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-muted-foreground text-[11px]">Sisa Yang Harus Dibayar</p>
                                        <p className="font-mono font-bold text-rose-600 text-sm">
                                            {formatCurrency(selectedStatementCustomer.remainingAmount)}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-xs text-foreground">Riwayat Mutasi Piutang:</h4>
                                    <div className="rounded-lg border divide-y">
                                        <div className="p-2.5 flex justify-between items-center bg-muted/10">
                                            <div>
                                                <span className="font-semibold block">{selectedStatementCustomer.invoiceDate} · Penerbitan Invoice #{selectedStatementCustomer.invoiceNo}</span>
                                                <span className="text-[11px] text-muted-foreground">Nilai kontrak pesanan {selectedStatementCustomer.jobTicketNo}</span>
                                            </div>
                                            <span className="font-mono font-bold text-foreground">+{formatCurrency(selectedStatementCustomer.totalAmount)}</span>
                                        </div>
                                        <div className="p-2.5 flex justify-between items-center bg-emerald-500/5">
                                            <div>
                                                <span className="font-semibold block text-emerald-700 dark:text-emerald-400">Pembayaran DP Terverifikasi (Bank BCA)</span>
                                                <span className="text-[11px] text-muted-foreground">Kwitansi Kas Masuk PAY-2026-10-xxx</span>
                                            </div>
                                            <span className="font-mono font-bold text-emerald-600">-{formatCurrency(selectedStatementCustomer.paidAmount)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs cursor-pointer"
                                        onClick={() => {
                                            window.open(`/admin/accounting/receivables/${selectedStatementCustomer.id}/statement`, '_blank');
                                            toast.success('Mengunduh File PDF Statement of Account...');
                                            setSelectedStatementCustomer(null);
                                        }}
                                    >
                                        <Download className="h-3.5 w-3.5 mr-1" /> Unduh PDF
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="text-xs cursor-pointer"
                                        onClick={() => {
                                            toast.success(`Statement of Account berhasil dikirim ke email finance ${selectedStatementCustomer.customer}`);
                                            setSelectedStatementCustomer(null);
                                        }}
                                    >
                                        Kirim ke Klien
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AccountingReceivables.layout = (page: React.ReactNode) => (
    <AppLayout
        title="Piutang Usaha & Aging Schedule (AR)"
        description="Monitoring umur piutang pelanggan konveksi dan penagihan terintegrasi."
        information="STAGE 2 · ACCOUNTS RECEIVABLE"
        breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Akuntansi', href: '/admin/accounting' },
            { title: 'Piutang Usaha', href: '/admin/accounting/receivables' },
        ]}
    >
        {page}
    </AppLayout>
);
