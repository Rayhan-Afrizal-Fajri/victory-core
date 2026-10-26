import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import {
    BookOpen,
    Plus,
    Search,
    Download,
    Upload,
    Filter,
    Check,
    Edit2,
    Trash2,
    Layers,
    FileSpreadsheet,
    HelpCircle
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
import { mockCOA, ChartOfAccountItem } from './data/accounting-mock';
import { toast } from 'sonner';

export default function AccountingCOA() {
    const [accounts, setAccounts] = useState<ChartOfAccountItem[]>(mockCOA);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form State for new account
    const [newAccountCode, setNewAccountCode] = useState('');
    const [newAccountName, setNewAccountName] = useState('');
    const [newCategory, setNewCategory] = useState<'asset' | 'liability' | 'equity' | 'revenue' | 'cogs' | 'expense'>('asset');
    const [newSubCategory, setNewSubCategory] = useState('Kas & Bank');
    const [newNormalBalance, setNewNormalBalance] = useState<'debit' | 'credit'>('debit');
    const [newBalance, setNewBalance] = useState<number>(0);

    const categories = [
        { id: 'all', label: 'Semua Rekening' },
        { id: 'asset', label: '1 - Aset' },
        { id: 'liability', label: '2 - Kewajiban' },
        { id: 'equity', label: '3 - Ekuitas' },
        { id: 'revenue', label: '4 - Pendapatan' },
        { id: 'cogs', label: '5 - HPP (COGS)' },
        { id: 'expense', label: '6 - Beban (OPEX)' },
    ];

    const filteredAccounts = useMemo(() => {
        return accounts.filter((acc) => {
            const matchSearch =
                acc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                acc.subCategory.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCategory = selectedCategory === 'all' || acc.category === selectedCategory;
            return matchSearch && matchCategory;
        });
    }, [accounts, searchTerm, selectedCategory]);

    const handleCreateAccount = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAccountCode || !newAccountName) {
            toast.error('Mohon isi kode dan nama akun!');
            return;
        }

        const newAccount: ChartOfAccountItem = {
            code: newAccountCode,
            name: newAccountName,
            category: newCategory,
            subCategory: newSubCategory,
            normalBalance: newNormalBalance,
            balance: Number(newBalance) || 0,
        };

        setAccounts([newAccount, ...accounts]);
        setIsAddModalOpen(false);
        toast.success(`Akun ${newAccountCode} - ${newAccountName} berhasil ditambahkan!`);

        // Reset
        setNewAccountCode('');
        setNewAccountName('');
        setNewBalance(0);
    };

    const handleExportCOA = () => {
        toast.success('Daftar Rekening COA berhasil diekspor ke format Excel (.xlsx)');
    };

    return (
        <>
            <Head title="Chart of Accounts (COA) - Master Rekening" />

            <div className="space-y-6">
                <AccountingHeader activeTab="coa" />

                {/* CONTROLS & ACTIONS BAR */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                        {/* Search Input */}
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari kode atau nama akun..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 text-xs"
                            />
                        </div>

                        {/* Category Select Filter */}
                        <div className="flex items-center gap-1 overflow-x-auto py-1">
                            {categories.map((cat) => (
                                <Button
                                    key={cat.id}
                                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className="h-8 text-xs cursor-pointer"
                                >
                                    {cat.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs cursor-pointer"
                            onClick={handleExportCOA}
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>Export COA</span>
                        </Button>
                        <Button
                            size="sm"
                            className="gap-1.5 text-xs cursor-pointer"
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Tambah Akun</span>
                        </Button>
                    </div>
                </div>

                {/* COA TABLE */}
                <Card className="shadow-xs">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-semibold">Daftar Bagan Akun (Chart of Accounts)</CardTitle>
                                <CardDescription className="text-xs">
                                    Struktur hierarki rekening standar pabrikasi garmen Victory Core (5 Digit)
                                </CardDescription>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                Menampilkan <strong>{filteredAccounts.length}</strong> akun
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/60 text-muted-foreground font-medium border-b">
                                    <tr>
                                        <th className="p-3 w-[120px]">Kode Akun</th>
                                        <th className="p-3">Nama Rekening</th>
                                        <th className="p-3 w-[140px]">Kategori</th>
                                        <th className="p-3 w-[160px]">Sub-Kategori</th>
                                        <th className="p-3 text-center w-[120px]">Posisi Normal</th>
                                        <th className="p-3 text-right w-[180px]">Saldo Berjalan</th>
                                        <th className="p-3 text-center w-[100px]">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredAccounts.map((account) => {
                                        const isHeader = account.isHeader;
                                        return (
                                            <tr
                                                key={account.code}
                                                className={`transition-colors ${
                                                    isHeader
                                                        ? 'bg-muted/40 font-bold text-foreground'
                                                        : 'hover:bg-muted/20 text-muted-foreground'
                                                }`}
                                            >
                                                <td className="p-3 font-mono font-semibold text-foreground">
                                                    {account.code}
                                                </td>
                                                <td className={`p-3 ${isHeader ? 'font-bold text-foreground text-sm' : 'text-foreground'}`}>
                                                    <span className={isHeader ? '' : 'pl-4'}>
                                                        {account.name}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] capitalize ${
                                                            account.category === 'asset'
                                                                ? 'border-blue-400 text-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                                                                : account.category === 'liability'
                                                                ? 'border-rose-400 text-rose-600 bg-rose-50/50 dark:bg-rose-950/30'
                                                                : account.category === 'equity'
                                                                ? 'border-purple-400 text-purple-600 bg-purple-50/50 dark:bg-purple-950/30'
                                                                : account.category === 'revenue'
                                                                ? 'border-emerald-400 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                                                                : account.category === 'cogs'
                                                                ? 'border-amber-400 text-amber-600 bg-amber-50/50 dark:bg-amber-950/30'
                                                                : 'border-slate-400 text-slate-600 bg-slate-50/50'
                                                        }`}
                                                    >
                                                        {account.category}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-foreground">{account.subCategory}</td>
                                                <td className="p-3 text-center">
                                                    <span
                                                        className={`inline-block rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                                            account.normalBalance === 'debit'
                                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                        }`}
                                                    >
                                                        {account.normalBalance}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right font-mono font-semibold text-foreground">
                                                    {formatCurrency(account.balance)}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {!isHeader && (
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                                                                onClick={() => toast.info(`Edit akun ${account.code}`)}
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* MODAL TAMBAH AKUN BARU */}
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">Tambah Rekening Akuntansi</DialogTitle>
                            <DialogDescription className="text-xs">
                                Masukkan detail akun baru sesuai struktur Chart of Accounts.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateAccount} className="space-y-4 py-2 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Kode Akun</Label>
                                    <Input
                                        placeholder="Contoh: 1-1140"
                                        value={newAccountCode}
                                        onChange={(e) => setNewAccountCode(e.target.value)}
                                        className="text-xs"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Kategori</Label>
                                    <Select
                                        value={newCategory}
                                        onValueChange={(val: any) => setNewCategory(val)}
                                    >
                                        <SelectTrigger className="text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="asset">1 - Aset</SelectItem>
                                            <SelectItem value="liability">2 - Kewajiban</SelectItem>
                                            <SelectItem value="equity">3 - Ekuitas</SelectItem>
                                            <SelectItem value="revenue">4 - Pendapatan</SelectItem>
                                            <SelectItem value="cogs">5 - HPP (COGS)</SelectItem>
                                            <SelectItem value="expense">6 - Beban (OPEX)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">Nama Rekening</Label>
                                <Input
                                    placeholder="Contoh: Bank BNI Giro Operasional"
                                    value={newAccountName}
                                    onChange={(e) => setNewAccountName(e.target.value)}
                                    className="text-xs"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Sub-Kategori</Label>
                                    <Input
                                        placeholder="Contoh: Kas & Bank"
                                        value={newSubCategory}
                                        onChange={(e) => setNewSubCategory(e.target.value)}
                                        className="text-xs"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Posisi Normal</Label>
                                    <Select
                                        value={newNormalBalance}
                                        onValueChange={(val: any) => setNewNormalBalance(val)}
                                    >
                                        <SelectTrigger className="text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="debit">Debit</SelectItem>
                                            <SelectItem value="credit">Credit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">Saldo Awal (Rp)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={newBalance}
                                    onChange={(e) => setNewBalance(Number(e.target.value))}
                                    className="text-xs"
                                />
                            </div>

                            <DialogFooter className="pt-3">
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
                                    Simpan Akun
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AccountingCOA.layout = (page: React.ReactNode) => (
    <AppLayout
        title="Bagan Akun (Chart of Accounts)"
        description="Master data akun rekening akuntansi terintegrasi pabrik konveksi."
        information="STAGE 2 · MASTER COA"
        breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Akuntansi', href: '/admin/accounting' },
            { title: 'Chart of Accounts', href: '/admin/accounting/coa' },
        ]}
    >
        {page}
    </AppLayout>
);
