import React, { useState, useMemo, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    ArrowUpRight,
    Search,
    Download,
    CreditCard,
    CheckCircle2,
    Calendar,
    AlertCircle,
    Building2,
    Layers,
    DollarSign,
    Upload
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AccountingHeader } from './components/accounting-header';
import { mockPayables, PayableItem, mockCOA } from './data/accounting-mock';
import { toast } from 'sonner';

interface PayableProps {
    payables?: any[];
    paymentAccounts?: any[];
    summary?: {
        totalAP: number;
        totalPaid: number;
        current: number;
        aging1_30: number;
        aging31_60: number;
        aging61_90: number;
        agingOver90: number;
    };
}

export default function AccountingPayables({ payables: propPayables, paymentAccounts: propPaymentAccounts, summary }: PayableProps) {
    const rawPayables = useMemo(() => {
        if (!propPayables || propPayables.length === 0) {
            return mockPayables;
        }
        return propPayables.map((b) => ({
            id: b.id,
            billNumber: b.billNumber,
            supplier: b.supplierName,
            category: 'Bahan Baku & Aksesoris',
            poRef: b.jobTicketNo,
            billDate: b.billDate,
            dueDate: b.dueDate,
            daysOverdue: b.daysOverdue,
            totalAmount: b.totalAmount,
            paidAmount: b.paidAmount,
            remainingAmount: b.remainingAmount,
            status: b.remainingAmount <= 0 ? 'paid' : (b.paidAmount > 0 ? 'partial' : 'unpaid'),
        }));
    }, [propPayables]);

    const [payables, setPayables] = useState<any[]>(rawPayables);
    const [searchTerm, setSearchTerm] = useState('');
    const [payingBill, setPayingBill] = useState<any | null>(null);

    useEffect(() => {
        setPayables(rawPayables);
    }, [rawPayables]);

    // Form State for Payment
    const [payAmount, setPayAmount] = useState<number>(0);
    const [payAccount, setPayAccount] = useState<string>('1-1120');
    const [payDate, setPayDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [payMethod, setPayMethod] = useState<string>('transfer');

    const filteredAP = payables.filter((bill) =>
        bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.poRef.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPayables = summary ? summary.totalAP : payables.reduce((acc, curr) => acc + curr.remainingAmount, 0);
    const totalDueThisWeek = payables.filter(p => p.remainingAmount > 0).slice(0, 2).reduce((a, c) => a + c.remainingAmount, 0);

    const handleOpenPayment = (bill: any) => {
        setPayingBill(bill);
        setPayAmount(bill.remainingAmount);
    };

    const handleConfirmPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!payingBill) return;

        if (payAmount <= 0 || payAmount > payingBill.remainingAmount) {
            toast.error('Jumlah pembayaran tidak valid!');
            return;
        }

        const selectedAcc = (propPaymentAccounts || []).find((a: any) => a.account_code === payAccount || a.id === payAccount);
        const accountId = selectedAcc ? selectedAcc.id : 1;

        router.post(`/admin/accounting/payables/${payingBill.id}/payment`, {
            payment_date: payDate,
            amount: payAmount,
            payment_method: payMethod,
            account_id: accountId,
            notes: `Pembayaran tagihan ${payingBill.billNumber}`,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setPayingBill(null);
                toast.success(`Pembayaran sebesar ${formatCurrency(payAmount)} ke ${payingBill.supplier} berhasil dicatat & jurnal otomatis diposting!`);
            },
            onError: (err) => {
                const msg = Object.values(err)[0] as string || 'Gagal memproses pembayaran.';
                toast.error(msg);
            }
        });
    };

    return (
        <>
            <Head title="Hutang Usaha & Tagihan Vendor (AP) - Stage 2" />

            <div className="space-y-6">
                <AccountingHeader activeTab="payables" />

                {/* SUMMARY STATS */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-rose-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Total Hutang Usaha</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono text-foreground">
                                {formatCurrency(totalPayables)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">Kewajiban supplier & makloon</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Jatuh Tempo Minggu Ini</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono text-amber-600">
                                {formatCurrency(totalDueThisWeek)}
                            </div>
                            <p className="mt-1 text-xs text-amber-600 font-medium">Prioritas pembayaran cash flow</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Hutang Bahan Baku (Kain)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono text-foreground">
                                {formatCurrency(18500000)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">CV Sumber Tekstil Bandung</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Hutang Vendor Makloon</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono text-foreground">
                                {formatCurrency(5400000)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">Sablon Cimahi & Bordir Prima</p>
                        </CardContent>
                    </Card>
                </div>

                {/* SEARCH & FILTERS */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari tagihan, supplier, nomor PO..."
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
                            onClick={() => toast.success('Rekap Tagihan Hutang (AP) berhasil diekspor!')}
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>Export Rekap AP</span>
                        </Button>
                    </div>
                </div>

                {/* PAYABLES TABLE */}
                <Card className="shadow-xs">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Daftar Tagihan Pembelian (Vendor Bills & AP Sub-Ledger)</CardTitle>
                        <CardDescription className="text-xs">
                            Tagihan yang terbentuk otomatis saat penerimaan bahan berstatus good atau pekerjaan makloon selesai
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/60 text-muted-foreground font-medium border-b text-[11px]">
                                    <tr>
                                        <th className="p-3">No. Tagihan (Bill)</th>
                                        <th className="p-3">Supplier / Vendor</th>
                                        <th className="p-3">Kategori</th>
                                        <th className="p-3">Ref PO</th>
                                        <th className="p-3">Jatuh Tempo</th>
                                        <th className="p-3 text-right">Total Tagihan</th>
                                        <th className="p-3 text-right">Sudah Dibayar</th>
                                        <th className="p-3 text-right font-bold">Sisa Hutang</th>
                                        <th className="p-3 text-center">Status</th>
                                        <th className="p-3 text-center w-30">Aksi Bayar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredAP.map((item) => (
                                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="p-3 font-mono font-semibold text-primary">
                                                {item.billNumber}
                                            </td>
                                            <td className="p-3 font-medium text-foreground">{item.supplier}</td>
                                            <td className="p-3">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {item.category}
                                                </Badge>
                                            </td>
                                            <td className="p-3 font-mono text-muted-foreground">{item.poRef}</td>
                                            <td className="p-3 font-mono text-foreground">
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
                                                {item.status === 'paid' ? (
                                                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                                                        Lunas
                                                    </Badge>
                                                ) : item.status === 'partial' ? (
                                                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px]">
                                                        Sebagian
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="text-[10px]">
                                                        Belum Bayar
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                {item.remainingAmount > 0 ? (
                                                    <Button
                                                        size="sm"
                                                        className="h-7 text-xs gap-1 cursor-pointer"
                                                        onClick={() => handleOpenPayment(item)}
                                                    >
                                                        <CreditCard className="h-3 w-3" /> Bayar
                                                    </Button>
                                                ) : (
                                                    <span className="text-[11px] text-muted-foreground font-medium">Selesai</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* MODAL PELUNASAN HUTANG VENDOR */}
                <Dialog open={!!payingBill} onOpenChange={() => setPayingBill(null)}>
                    <DialogContent className="sm:max-w-125">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">Form Pembayaran Hutang Supplier</DialogTitle>
                            <DialogDescription className="text-xs">
                                Pembayaran tagihan #{payingBill?.billNumber} ke {payingBill?.supplier}
                            </DialogDescription>
                        </DialogHeader>

                        {payingBill && (
                            <form onSubmit={handleConfirmPayment} className="space-y-4 py-2 text-xs">
                                <div className="rounded-lg border bg-muted/20 p-3 flex justify-between items-center">
                                    <div>
                                        <p className="text-muted-foreground text-[11px]">Sisa Tagihan Saat Ini</p>
                                        <p className="font-mono font-bold text-rose-600 text-sm">{formatCurrency(payingBill.remainingAmount)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-muted-foreground text-[11px]">Batas Jatuh Tempo</p>
                                        <p className="font-mono font-medium text-foreground text-xs">{payingBill.dueDate}</p>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs">Jumlah Yang Ingin Dibayar (Rp)</Label>
                                    <Input
                                        type="number"
                                        value={payAmount}
                                        onChange={(e) => setPayAmount(Number(e.target.value))}
                                        max={payingBill.remainingAmount}
                                        min={1000}
                                        className="text-xs font-mono font-bold"
                                        required
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Anda dapat membayar penuh atau mencicil sebagian.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Rekening Kas/Bank Pengirim</Label>
                                        <Select value={payAccount} onValueChange={setPayAccount}>
                                            <SelectTrigger className="text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1-1120">Bank BCA Operasional</SelectItem>
                                                <SelectItem value="1-1130">Bank Mandiri Penerimaan</SelectItem>
                                                <SelectItem value="1-1110">Kas Operasional (Petty Cash)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Tanggal Pembayaran</Label>
                                        <Input
                                            type="date"
                                            value={payDate}
                                            onChange={(e) => setPayDate(e.target.value)}
                                            className="text-xs"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs">Metode Pembayaran</Label>
                                    <Select value={payMethod} onValueChange={setPayMethod}>
                                        <SelectTrigger className="text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="transfer">Transfer Bank (BCA Klik / Mandiri Livin)</SelectItem>
                                            <SelectItem value="cash">Tunai (Cash dari Kasbon)</SelectItem>
                                            <SelectItem value="giro">Giro / Cek Mundur</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2.5 text-xs text-blue-700 dark:text-blue-300">
                                    <strong>Auto-Journal Trigger:</strong> Transaksi ini otomatis menjurnal Debit Hutang Usaha (2-11xx) dan Kredit Kas/Bank (1-11xx).
                                </div>

                                <DialogFooter className="pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPayingBill(null)}
                                        className="text-xs"
                                    >
                                        Batal
                                    </Button>
                                    <Button type="submit" size="sm" className="text-xs cursor-pointer">
                                        Konfirmasi Pembayaran
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AccountingPayables.layout = (page: React.ReactNode) => (
    <AppLayout
        title="Hutang Usaha & Tagihan Vendor (AP)"
        description="Pengelolaan kewajiban pembayaran supplier bahan kain & vendor makloon."
        information="STAGE 2 · ACCOUNTS PAYABLE"
        breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Akuntansi', href: '/admin/accounting' },
            { title: 'Hutang Usaha', href: '/admin/accounting/payables' },
        ]}
    >
        {page}
    </AppLayout>
);
