import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
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

export default function AccountingExpenses() {
    const [expenses, setExpenses] = useState<ExpenseItem[]>(initialExpenses);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form State
    const [expDate, setExpDate] = useState('2026-10-26');
    const [expCategory, setExpCategory] = useState<string>('Pemeliharaan');
    const [expAccount, setExpAccount] = useState<string>('6-5000');
    const [expPaidFrom, setExpPaidFrom] = useState<string>('Kas Operasional (Petty Cash)');
    const [expAmount, setExpAmount] = useState<number>(0);
    const [expRecipient, setExpRecipient] = useState<string>('');
    const [expDesc, setExpDesc] = useState<string>('');

    const totalOPEX = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const pettyCashBalance = 8500000;
    const imprestLimit = 10000000;

    const handleCreateExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if (!expAmount || !expDesc) {
            toast.error('Mohon isi nominal dan keterangan pengeluaran!');
            return;
        }

        const newExpense: ExpenseItem = {
            id: `EXP-${Date.now()}`,
            expenseNo: `EXP/2026/10/00${expenses.length + 49}`,
            date: expDate,
            accountCode: expAccount,
            accountName: expCategory === 'Utilitas' ? 'Beban Listrik & Air' : 'Beban Pemeliharaan & Alat',
            category: expCategory as any,
            paidFrom: expPaidFrom,
            amount: expAmount,
            recipient: expRecipient || 'Vendor / Toko',
            description: expDesc,
        };

        setExpenses([newExpense, ...expenses]);
        setIsAddModalOpen(false);
        toast.success(`Pengeluaran sebesar ${formatCurrency(expAmount)} berhasil dicatat!`);

        // Reset
        setExpAmount(0);
        setExpDesc('');
        setExpRecipient('');
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
                    <Card className="bg-gradient-to-br from-primary/10 via-background to-primary/5 shadow-xs flex flex-col justify-between">
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
                                        <th className="p-3 w-[140px]">No. Bukti & Tgl</th>
                                        <th className="p-3 w-[150px]">Kategori & Akun</th>
                                        <th className="p-3">Deskripsi / Peruntukan</th>
                                        <th className="p-3">Penerima Dana</th>
                                        <th className="p-3">Sumber Dana</th>
                                        <th className="p-3 text-right w-[150px] font-bold">Nominal (Rp)</th>
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
                    <DialogContent className="sm:max-w-[500px]">
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
                                    <Label className="text-xs">Kategori Biaya</Label>
                                    <Select value={expCategory} onValueChange={setExpCategory}>
                                        <SelectTrigger className="text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Utilitas">Listrik & Internet (6-3000)</SelectItem>
                                            <SelectItem value="Pemeliharaan">Sparepart & Oli Mesin (6-5000)</SelectItem>
                                            <SelectItem value="Konsumsi">Konsumsi & ATK (6-7000)</SelectItem>
                                            <SelectItem value="Fasilitas">Sewa Workshop (6-2000)</SelectItem>
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
                                <Label className="text-xs">Dibayar Melalui</Label>
                                <Select value={expPaidFrom} onValueChange={setExpPaidFrom}>
                                    <SelectTrigger className="text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Kas Operasional (Petty Cash)">Kas Operasional (Petty Cash)</SelectItem>
                                        <SelectItem value="Bank BCA Operasional">Bank BCA Operasional</SelectItem>
                                        <SelectItem value="Bank Mandiri Penerimaan">Bank Mandiri Penerimaan</SelectItem>
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
                                <Button type="submit" size="sm" className="text-xs cursor-pointer">
                                    Simpan Pengeluaran
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
