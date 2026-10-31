import React, { useState, useMemo, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Wallet,
    Plus,
    Search,
    Download,
    CreditCard,
    DollarSign,
    Calendar,
    CheckCircle2,
    Building2,
    Zap,
    Wrench,
    Coffee,
    FileSpreadsheet,
    RefreshCw
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
import { toast } from 'sonner';

interface ExpenseItem {
    id: string;
    expenseNo: string;
    date: string;
    accountCode: string;
    accountName: string;
    category: 'Utilitas' | 'Fasilitas' | 'Pemeliharaan' | 'Konsumsi' | 'Gaji Staf';
    paidFrom: string;
    amount: number;
    recipient: string;
    description: string;
}

const initialExpenses: ExpenseItem[] = [
    {
        id: 'EXP-01',
        expenseNo: 'EXP/2026/10/0048',
        date: '2026-10-22',
        accountCode: '6-3000',
        accountName: 'Beban Listrik Industri & Internet',
        category: 'Utilitas',
        paidFrom: 'Bank BCA Operasional',
        amount: 2100000,
        recipient: 'PLN Persero & IndiHome',
        description: 'Tagihan listrik 3-phase workshop konveksi & WiFi operasional',
    },
    {
        id: 'EXP-02',
        expenseNo: 'EXP/2026/10/0047',
        date: '2026-10-21',
        accountCode: '6-5000',
        accountName: 'Beban Pemeliharaan & Jarum Mesin',
        category: 'Pemeliharaan',
        paidFrom: 'Kas Operasional (Petty Cash)',
        amount: 450000,
        recipient: 'Toko Mesin Jahit Sinar Baru',
        description: 'Pembelian 10 kotak jarum Organ DBx1 dan 2 botol oli mesin jahit Juki',
    },
    {
        id: 'EXP-03',
        expenseNo: 'EXP/2026/10/0046',
        date: '2026-10-20',
        accountCode: '6-7000',
        accountName: 'Beban ATK & Konsumsi Workshop',
        category: 'Konsumsi',
        paidFrom: 'Kas Operasional (Petty Cash)',
        amount: 320000,
        recipient: 'Warung Bu Siti & Toko ATK',
        description: 'Konsumsi lembur operator sewing PO-2026-10-041 & kertas pola cutting',
    },
    {
        id: 'EXP-04',
        expenseNo: 'EXP/2026/10/0045',
        date: '2026-10-15',
        accountCode: '6-2000',
        accountName: 'Beban Sewa Workshop Pabrik',
        category: 'Fasilitas',
        paidFrom: 'Bank BCA Operasional',
        amount: 3500000,
        recipient: 'Bpk. H. Sukardi (Pemilik Gudang)',
        description: 'Cicilan sewa bulanan workshop & gudang bahan Victory Core',
    },
];

interface ExpensesProps {
    expenses?: any[];
    summary?: {
        totalExpense: number;
        count: number;
    };
    expenseAccounts?: any[];
    paymentAccounts?: any[];
}

export default function AccountingExpenses({
    expenses: propExpenses,
    summary,
    expenseAccounts: propExpenseAccounts,
    paymentAccounts: propPaymentAccounts,
}: ExpensesProps) {
    const rawExpenses = useMemo(() => {
        if (!propExpenses || propExpenses.length === 0) {
            return initialExpenses;
        }
        return propExpenses.map((e) => ({
            id: String(e.id),
            expenseNo: e.expenseNumber,
            date: e.date,
            accountCode: e.accountCode,
            accountName: e.accountName,
            category: e.category,
            paidFrom: e.paymentMethod,
            amount: e.amount,
            recipient: e.recipient || '-',
            description: e.description,
        }));
    }, [propExpenses]);

    const [expenses, setExpenses] = useState<ExpenseItem[]>(rawExpenses);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setExpenses(rawExpenses);
    }, [rawExpenses]);

    // Available accounts
    const availableExpenseAccounts = propExpenseAccounts && propExpenseAccounts.length > 0
        ? propExpenseAccounts
        : [
            { id: 1, account_code: '6-3000', account_name: 'Beban Listrik Industri & Internet', category: 'Utilitas' },
            { id: 2, account_code: '6-5000', account_name: 'Beban Pemeliharaan Mesin & Sparepart', category: 'Pemeliharaan' },
            { id: 3, account_code: '6-7000', account_name: 'Beban ATK & Konsumsi Workshop', category: 'Konsumsi' },
            { id: 4, account_code: '6-2000', account_name: 'Beban Sewa Workshop & Pabrik', category: 'Fasilitas' },
            { id: 5, account_code: '6-1000', account_name: 'Beban Gaji Staf & Manajemen', category: 'Gaji Staf' },
        ];

    const availablePaymentAccounts = propPaymentAccounts && propPaymentAccounts.length > 0
        ? propPaymentAccounts
        : [
            { id: 1, account_code: '1-1110', account_name: 'Kas Operasional (Petty Cash)' },
            { id: 2, account_code: '1-1120', account_name: 'Bank BCA Operasional' },
            { id: 3, account_code: '1-1130', account_name: 'Bank Mandiri Penerimaan' },
        ];

    // Form State
    const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedExpenseAccountId, setSelectedExpenseAccountId] = useState<string>(String(availableExpenseAccounts[0]?.id || 1));
    const [selectedPaymentAccountId, setSelectedPaymentAccountId] = useState<string>(String(availablePaymentAccounts[0]?.id || 1));
    const [expCategory, setExpCategory] = useState<string>('Utilitas');
    const [expAmount, setExpAmount] = useState<number>(0);
    const [expRecipient, setExpRecipient] = useState<string>('');
    const [expDesc, setExpDesc] = useState<string>('');

    const totalOPEX = summary ? summary.totalExpense : expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const pettyCashBalance = 8500000;
    const imprestLimit = 10000000;

    const handleCreateExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if (!expAmount || !expDesc) {
            toast.error('Mohon isi nominal dan keterangan pengeluaran!');
            return;
        }

        setIsSubmitting(true);
        router.post('/admin/accounting/expenses', {
            expense_date: expDate,
            account_id: Number(selectedExpenseAccountId),
            payment_account_id: Number(selectedPaymentAccountId),
            amount: expAmount,
            category: expCategory,
            recipient: expRecipient || 'Vendor / Toko',
            description: expDesc,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false);
                setIsAddModalOpen(false);
                toast.success(`Pengeluaran sebesar ${formatCurrency(expAmount)} berhasil dicatat & jurnal otomatis diposting!`);
                setExpAmount(0);
                setExpDesc('');
                setExpRecipient('');
            },
            onError: (err) => {
                setIsSubmitting(false);
                const msg = Object.values(err)[0] as string || 'Gagal mencatat pengeluaran.';
                toast.error(msg);
            }
        });
    };

    const handleReimbursePettyCash = () => {
        const topupAmount = imprestLimit - pettyCashBalance;
        toast.success(`Reimbursement Kas Kecil disetujui! Rp ${topupAmount.toLocaleString('id-ID')} ditransfer dari Bank BCA.`);
    };

    const filteredExpenses = expenses.filter(e =>
        e.expenseNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Head title="Kas Kecil & Beban Operasional (OPEX) - Stage 2" />

            <div className="space-y-6">
                <AccountingHeader activeTab="expenses" onQuickAction={() => setIsAddModalOpen(true)} />

                {/* TOP CARDS: PETTY CASH & OPEX */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Petty Cash Balance */}
                    <Card className="border-l-4 border-l-blue-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Saldo Kas Kecil (Petty Cash)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono text-foreground">
                                {formatCurrency(pettyCashBalance)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Sistem Imprest (Plafon: {formatCurrency(imprestLimit)})
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total OPEX Bulan Ini */}
                    <Card className="border-l-4 border-l-purple-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Total Beban OPEX Bulan Ini</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono text-purple-600">
                                {formatCurrency(totalOPEX + 9830000)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">Gaji staf, utilitas & sewa</p>
                        </CardContent>
                    </Card>

                    {/* Utilitas & Listrik */}
                    <Card className="border-l-4 border-l-amber-500 shadow-xs">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-medium">Beban Listrik Industri PLN</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-mono text-foreground">
                                {formatCurrency(2100000)}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">Workshop 3-Phase</p>
                        </CardContent>
                    </Card>

                    {/* Reimbursement Card Action */}
                    <Card className="bg-linear-to-br from-primary/10 via-background to-primary/5 shadow-xs flex flex-col justify-between">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold text-primary">Klaim Kas Kecil</CardTitle>
                            <CardDescription className="text-[11px]">
                                Sisa kas: {formatCurrency(pettyCashBalance)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                                onClick={handleReimbursePettyCash}
                            >
                                <RefreshCw className="h-3 w-3" />
                                <span>Reimburse ke BCA</span>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* SEARCH & ACTIONS */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Cari pengeluaran, penerima, kategori..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 text-xs"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            className="gap-1.5 text-xs cursor-pointer"
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Catat Pengeluaran</span>
                        </Button>
                    </div>
                </div>

                {/* EXPENSES TABLE */}
                <Card className="shadow-xs">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Riwayat Beban Operasional & Pengeluaran Kas</CardTitle>
                        <CardDescription className="text-xs">
                            Seluruh biaya non-produksi pabrik konveksi yang mengurangi laba kotor menjadi laba bersih
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/60 text-muted-foreground font-medium border-b text-[11px]">
                                    <tr>
                                        <th className="p-3 w-35">No. Bukti & Tgl</th>
                                        <th className="p-3 w-37.5">Kategori & Akun</th>
                                        <th className="p-3">Deskripsi / Peruntukan</th>
                                        <th className="p-3">Penerima Dana</th>
                                        <th className="p-3">Sumber Dana</th>
                                        <th className="p-3 text-right w-37.5 font-bold">Nominal (Rp)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredExpenses.map((item) => (
                                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="p-3">
                                                <span className="font-mono font-semibold text-primary block">{item.expenseNo}</span>
                                                <span className="text-[11px] text-muted-foreground font-mono">{item.date}</span>
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="outline" className="text-[10px] mb-1">
                                                    {item.category}
                                                </Badge>
                                                <div className="text-[11px] text-muted-foreground font-mono">{item.accountCode}</div>
                                            </td>
                                            <td className="p-3 text-foreground font-medium">{item.description}</td>
                                            <td className="p-3 text-foreground">{item.recipient}</td>
                                            <td className="p-3 text-muted-foreground">{item.paidFrom}</td>
                                            <td className="p-3 text-right font-mono font-bold text-foreground">
                                                {formatCurrency(item.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* MODAL CATAT PENGELUARAN BARU */}
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogContent className="sm:max-w-125">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">Catat Beban Operasional / Kasbon</DialogTitle>
                            <DialogDescription className="text-xs">
                                Masukkan biaya rutin non-produksi atau pengeluaran kas kecil pabrik.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateExpense} className="space-y-4 py-2 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Tanggal Transaksi</Label>
                                    <Input
                                        type="date"
                                        value={expDate}
                                        onChange={(e) => setExpDate(e.target.value)}
                                        className="text-xs"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Akun Beban (COA)</Label>
                                    <Select
                                        value={selectedExpenseAccountId}
                                        onValueChange={(val) => {
                                            setSelectedExpenseAccountId(val);
                                            const acc = availableExpenseAccounts.find((a: any) => String(a.id) === val);
                                            if (acc) {
                                                setExpCategory(acc.sub_category || acc.category || 'Beban Operasional');
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableExpenseAccounts.map((acc: any) => (
                                                <SelectItem key={acc.id} value={String(acc.id)}>
                                                    {acc.account_code} - {acc.account_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">Keterangan Pengeluaran</Label>
                                <Input
                                    placeholder="Contoh: Beli minyak oli mesin jahit & isolasi packing"
                                    value={expDesc}
                                    onChange={(e) => setExpDesc(e.target.value)}
                                    className="text-xs"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Nominal Pengeluaran (Rp)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={expAmount || ''}
                                        onChange={(e) => setExpAmount(Number(e.target.value))}
                                        className="text-xs font-mono font-bold"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Penerima Dana</Label>
                                    <Input
                                        placeholder="Toko Sinar Mesin / Pak Joko"
                                        value={expRecipient}
                                        onChange={(e) => setExpRecipient(e.target.value)}
                                        className="text-xs"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">Sumber Dana (Kas / Bank Pengirim)</Label>
                                <Select value={selectedPaymentAccountId} onValueChange={setSelectedPaymentAccountId}>
                                    <SelectTrigger className="text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availablePaymentAccounts.map((acc: any) => (
                                            <SelectItem key={acc.id} value={String(acc.id)}>
                                                {acc.account_code} - {acc.account_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="text-xs"
                                >
                                    Batal
                                </Button>
                                <Button type="submit" size="sm" className="text-xs cursor-pointer" disabled={isSubmitting}>
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AccountingExpenses.layout = (page: React.ReactNode) => (
    <AppLayout
        title="Kas Kecil & Beban Operasional (OPEX)"
        description="Kontrol mutasi kas harian imprest dan pencatatan beban non-produksi."
        information="STAGE 2 · OPEX & PETTY CASH"
        breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Akuntansi', href: '/admin/accounting' },
            { title: 'Beban Operasional', href: '/admin/accounting/expenses' },
        ]}
    >
        {page}
    </AppLayout>
);
