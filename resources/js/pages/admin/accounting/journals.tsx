import React, { useState, useMemo, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    FileText,
    Plus,
    Search,
    Filter,
    Calendar,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    BookOpen,
    Trash2,
    ShieldAlert,
    ExternalLink,
    ChevronDown
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
import { mockJournals, mockCOA, JournalEntry, JournalLine } from './data/accounting-mock';
import { toast } from 'sonner';

interface JournalsProps {
    journals?: {
        data: JournalEntry[];
        links: any[];
        total: number;
    } | JournalEntry[];
    accounts?: any[];
    filters?: any;
}

export default function AccountingJournals({ journals: propJournals, accounts: propAccounts }: JournalsProps) {
    const rawJournals = useMemo(() => {
        if (!propJournals) return mockJournals;
        if (Array.isArray(propJournals)) return propJournals.length > 0 ? propJournals : mockJournals;
        return propJournals.data && propJournals.data.length > 0 ? propJournals.data : mockJournals;
    }, [propJournals]);

    const availableAccounts = useMemo(() => {
        if (propAccounts && propAccounts.length > 0) {
            return propAccounts.map((a: any) => ({
                id: a.id,
                code: a.account_code || a.code,
                name: a.account_name || a.name,
                normalBalance: a.normal_balance || a.normalBalance || 'debit',
                balance: a.balance || 0,
                isHeader: a.isHeader || false,
            }));
        }
        return mockCOA;
    }, [propAccounts]);

    const [journals, setJournals] = useState<JournalEntry[]>(rawJournals);
    const [viewMode, setViewMode] = useState<'journal' | 'ledger'>('journal');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRefType, setSelectedRefType] = useState<string>('all');
    const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<string>('1-1120');

    useEffect(() => {
        setJournals(rawJournals);
    }, [rawJournals]);

    // Manual Journal Modal State
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [journalDate, setJournalDate] = useState(new Date().toISOString().slice(0, 10));
    const [journalDescription, setJournalDescription] = useState('');
    const [manualLines, setManualLines] = useState<JournalLine[]>([
        { accountCode: '1-1110', accountName: 'Kas Operasional (Petty Cash Pabrik)', debit: 1500000, credit: 0 },
        { accountCode: '1-1120', accountName: 'Bank BCA Operasional', debit: 0, credit: 1500000 },
    ]);

    // Calculate manual totals
    const totalManualDebit = manualLines.reduce((acc, curr) => acc + (Number(curr.debit) || 0), 0);
    const totalManualCredit = manualLines.reduce((acc, curr) => acc + (Number(curr.credit) || 0), 0);
    const isBalanced = totalManualDebit > 0 && totalManualDebit === totalManualCredit;

    const handleAddManualLine = () => {
        setManualLines([
            ...manualLines,
            { accountCode: '6-7000', accountName: 'Beban ATK & Konsumsi Workshop', debit: 0, credit: 0 },
        ]);
    };

    const handleRemoveManualLine = (index: number) => {
        if (manualLines.length <= 2) {
            toast.warning('Minimal harus ada 2 baris (Debit & Kredit)');
            return;
        }
        setManualLines(manualLines.filter((_, i) => i !== index));
    };

    const handleLineAccountChange = (index: number, code: string) => {
        const found = availableAccounts.find((c: any) => (c.code || c.account_code) === code);
        const updated = [...manualLines];
        updated[index].accountCode = code;
        updated[index].accountName = found ? (found.name || found.account_name) : '';
        setManualLines(updated);
    };

    const handleLineAmountChange = (index: number, field: 'debit' | 'credit', value: number) => {
        const updated = [...manualLines];
        updated[index][field] = value;
        setManualLines(updated);
    };

    const handleSaveManualJournal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!journalDescription) {
            toast.error('Mohon isi keterangan jurnal!');
            return;
        }
        if (!isBalanced) {
            toast.error('Jurnal tidak seimbang! Total Debit harus sama dengan Total Kredit.');
            return;
        }

        const payloadLines = manualLines.map(line => {
            const acc = availableAccounts.find((c: any) => (c.code || c.account_code) === line.accountCode);
            return {
                account_id: acc ? acc.id : null,
                account_code: line.accountCode,
                debit: line.debit,
                credit: line.credit,
                memo: line.accountName,
            };
        });

        router.post('/admin/accounting/journals', {
            entry_date: journalDate,
            description: journalDescription,
            lines: payloadLines,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsManualModalOpen(false);
                toast.success('Jurnal manual berhasil disimpan & diposting ke Buku Besar!');
                setJournalDescription('');
            },
            onError: (err) => {
                const msg = Object.values(err)[0] as string || 'Gagal menyimpan jurnal manual.';
                toast.error(msg);
            }
        });
    };

    // Filtered Journals
    const filteredJournals = useMemo(() => {
        return journals.filter((j) => {
            const matchSearch =
                j.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                j.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (j.jobTicketNo && j.jobTicketNo.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchType = selectedRefType === 'all' || j.referenceType === selectedRefType;
            return matchSearch && matchType;
        });
    }, [journals, searchTerm, selectedRefType]);

    // Ledger Calculation for Selected Account
    const ledgerData = useMemo(() => {
        const targetAcc = availableAccounts.find((c: any) => c.code === selectedLedgerAccount);
        let runningBalance = targetAcc ? (targetAcc.balance || 0) : 0;
        const rows: any[] = [];

        journals.forEach((j) => {
            j.lines.forEach((line) => {
                if (line.accountCode === selectedLedgerAccount) {
                    if (targetAcc?.normalBalance === 'debit') {
                        runningBalance += (line.debit - line.credit);
                    } else {
                        runningBalance += (line.credit - line.debit);
                    }
                    rows.push({
                        date: j.date,
                        entryNumber: j.entryNumber,
                        ref: j.jobTicketNo || j.referenceNumber,
                        description: j.description,
                        debit: line.debit,
                        credit: line.credit,
                        balance: runningBalance,
                    });
                }
            });
        });

        return { targetAcc, rows };
    }, [journals, selectedLedgerAccount]);

    return (
        <>
            <Head title="Jurnal Transaksi & Buku Besar - Stage 2" />

            <div className="space-y-6">
                <AccountingHeader activeTab="journals" onQuickAction={() => setIsManualModalOpen(true)} />

                {/* VIEW MODE TOGGLE & CONTROLS */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg border bg-muted/40 p-1 flex">
                            <Button
                                variant={viewMode === 'journal' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('journal')}
                                className="h-8 text-xs cursor-pointer"
                            >
                                Jurnal Transaksi (General Journal)
                            </Button>
                            <Button
                                variant={viewMode === 'ledger' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('ledger')}
                                className="h-8 text-xs cursor-pointer"
                            >
                                Buku Besar (General Ledger)
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {viewMode === 'journal' ? (
                            <>
                                <div className="relative w-full max-w-xs">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari nomor jurnal, PO, deskripsi..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 text-xs"
                                    />
                                </div>
                                <Select value={selectedRefType} onValueChange={setSelectedRefType}>
                                    <SelectTrigger className="w-[150px] text-xs">
                                        <SelectValue placeholder="Tipe Referensi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Event</SelectItem>
                                        <SelectItem value="invoice">Invoice Penjualan</SelectItem>
                                        <SelectItem value="payment">Penerimaan Kas</SelectItem>
                                        <SelectItem value="receiving">Penerimaan Bahan</SelectItem>
                                        <SelectItem value="production_run">HPP Produksi</SelectItem>
                                        <SelectItem value="payroll">Upah Borongan</SelectItem>
                                        <SelectItem value="expense">Beban OPEX</SelectItem>
                                        <SelectItem value="manual">Jurnal Manual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground">Pilih Akun Rekening:</Label>
                                <Select value={selectedLedgerAccount} onValueChange={setSelectedLedgerAccount}>
                                    <SelectTrigger className="w-[280px] text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableAccounts.filter((c: any) => !c.isHeader).map((c: any) => (
                                            <SelectItem key={c.code} value={c.code}>
                                                {c.code} - {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <Button
                            size="sm"
                            className="gap-1.5 text-xs cursor-pointer"
                            onClick={() => setIsManualModalOpen(true)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Jurnal Manual</span>
                        </Button>
                    </div>
                </div>

                {/* VIEW 1: GENERAL JOURNAL (JURNAL UMUM) */}
                {viewMode === 'journal' && (
                    <div className="space-y-4">
                        {filteredJournals.map((journal) => (
                            <Card key={journal.id} className="shadow-xs overflow-hidden">
                                <div className="border-b bg-muted/40 px-4 py-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <span className="font-mono font-bold text-xs text-foreground">
                                                {journal.entryNumber}
                                            </span>
                                            {journal.isAuto ? (
                                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold border-emerald-500/30">
                                                    Auto-Journal Event
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] font-semibold border-primary/40 text-primary">
                                                    Jurnal Manual
                                                </Badge>
                                            )}
                                            {journal.jobTicketNo && (
                                                <Badge variant="secondary" className="text-[10px] font-mono">
                                                    {journal.jobTicketNo}
                                                </Badge>
                                            )}
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {journal.date}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-muted-foreground">
                                                Ref: <strong className="text-foreground">{journal.referenceNumber}</strong>
                                            </span>
                                            <Badge variant="outline" className="text-emerald-600 border-emerald-400 text-[10px]">
                                                Balanced
                                            </Badge>
                                        </div>
                                    </div>
                                    <p className="mt-1 text-xs text-foreground font-medium">
                                        {journal.description}
                                    </p>
                                </div>

                                <CardContent className="p-0">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-muted/20 text-muted-foreground border-b text-[11px]">
                                            <tr>
                                                <th className="p-3 w-[140px]">Kode Akun</th>
                                                <th className="p-3">Nama Rekening & Memo</th>
                                                <th className="p-3 text-right w-[180px]">Debit (Rp)</th>
                                                <th className="p-3 text-right w-[180px]">Kredit (Rp)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {journal.lines.map((line, idx) => (
                                                <tr key={idx} className="hover:bg-muted/10">
                                                    <td className="p-3 font-mono font-medium text-foreground">
                                                        {line.accountCode}
                                                    </td>
                                                    <td className="p-3 text-foreground">
                                                        <span className={line.credit > 0 ? 'pl-6 block text-muted-foreground' : 'font-medium'}>
                                                            {line.accountName}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right font-mono font-medium text-emerald-700 dark:text-emerald-400">
                                                        {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                                                    </td>
                                                    <td className="p-3 text-right font-mono font-medium text-blue-700 dark:text-blue-400">
                                                        {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-muted/30 font-bold border-t">
                                                <td colSpan={2} className="p-3 text-right text-foreground">
                                                    Total Seimbang (Balance):
                                                </td>
                                                <td className="p-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                                                    {formatCurrency(journal.totalDebit)}
                                                </td>
                                                <td className="p-3 text-right font-mono text-blue-700 dark:text-blue-400">
                                                    {formatCurrency(journal.totalCredit)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* VIEW 2: GENERAL LEDGER (BUKU BESAR) */}
                {viewMode === 'ledger' && (
                    <Card className="shadow-xs">
                        <CardHeader>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-semibold">
                                            Buku Besar: {ledgerData.targetAcc?.code} - {ledgerData.targetAcc?.name}
                                        </CardTitle>
                                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                            Normal: {ledgerData.targetAcc?.normalBalance}
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs">
                                        Riwayat mutasi dan saldo berjalan buku besar rekening terpilih
                                    </CardDescription>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-muted-foreground block">Saldo Akhir:</span>
                                    <span className="text-base font-bold font-mono text-primary">
                                        {formatCurrency(ledgerData.targetAcc?.balance || 0)}
                                    </span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/60 text-muted-foreground font-medium border-b">
                                        <tr>
                                            <th className="p-3 w-[110px]">Tanggal</th>
                                            <th className="p-3 w-[150px]">No. Jurnal</th>
                                            <th className="p-3 w-[150px]">No. Referensi</th>
                                            <th className="p-3">Keterangan Transaksi</th>
                                            <th className="p-3 text-right w-[140px]">Debit</th>
                                            <th className="p-3 text-right w-[140px]">Kredit</th>
                                            <th className="p-3 text-right w-[160px]">Saldo Berjalan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {ledgerData.rows.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                                                    Tidak ada mutasi transaksi pada periode ini untuk rekening ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            ledgerData.rows.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-muted/30">
                                                    <td className="p-3 font-mono text-muted-foreground">{row.date}</td>
                                                    <td className="p-3 font-mono font-medium text-primary">{row.entryNumber}</td>
                                                    <td className="p-3 font-mono text-foreground">{row.ref}</td>
                                                    <td className="p-3 text-foreground">{row.description}</td>
                                                    <td className="p-3 text-right font-mono font-medium text-emerald-600">
                                                        {row.debit > 0 ? formatCurrency(row.debit) : '-'}
                                                    </td>
                                                    <td className="p-3 text-right font-mono font-medium text-rose-600">
                                                        {row.credit > 0 ? formatCurrency(row.credit) : '-'}
                                                    </td>
                                                    <td className="p-3 text-right font-mono font-bold text-foreground">
                                                        {formatCurrency(row.balance)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* MODAL FORM CATAT JURNAL MANUAL */}
                <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
                    <DialogContent className="sm:max-w-[700px]">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold flex items-center gap-2">
                                <Plus className="h-4 w-4 text-primary" />
                                Buat Jurnal Penyesuaian Manual (Double-Entry)
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Masukkan transaksi manual seperti setoran modal, penyusutan aset, atau koreksi pembukuan.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSaveManualJournal} className="space-y-4 py-2 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Tanggal Transaksi</Label>
                                    <Input
                                        type="date"
                                        value={journalDate}
                                        onChange={(e) => setJournalDate(e.target.value)}
                                        className="text-xs"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Nomor Dokumen Bukti (Opsional)</Label>
                                    <Input
                                        placeholder="Contoh: BKM-009 / MEMO-2026-10"
                                        className="text-xs"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">Keterangan / Deskripsi Transaksi</Label>
                                <Input
                                    placeholder="Contoh: Pengisian kembali Kas Kecil (Petty Cash) dari Bank BCA"
                                    value={journalDescription}
                                    onChange={(e) => setJournalDescription(e.target.value)}
                                    className="text-xs"
                                    required
                                />
                            </div>

                            {/* DYNAMIC JOURNAL LINES TABLE */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold">Rincian Akun (Debit & Kredit)</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddManualLine}
                                        className="h-7 text-xs gap-1 cursor-pointer"
                                    >
                                        <Plus className="h-3 w-3" /> Tambah Baris
                                    </Button>
                                </div>

                                <div className="rounded-lg border overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-muted text-muted-foreground font-medium border-b text-[11px]">
                                            <tr>
                                                <th className="p-2">Akun Rekening</th>
                                                <th className="p-2 w-[150px]">Debit (Rp)</th>
                                                <th className="p-2 w-[150px]">Kredit (Rp)</th>
                                                <th className="p-2 w-[40px]"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {manualLines.map((line, idx) => (
                                                <tr key={idx}>
                                                    <td className="p-2">
                                                        <select
                                                            value={line.accountCode}
                                                            onChange={(e) => handleLineAccountChange(idx, e.target.value)}
                                                            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground shadow-xs focus:ring-1 focus:ring-primary"
                                                        >
                                                            {availableAccounts.filter((c: any) => !c.isHeader).map((c: any) => (
                                                                <option key={c.code} value={c.code}>
                                                                    {c.code} - {c.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="p-2">
                                                        <Input
                                                            type="number"
                                                            value={line.debit || ''}
                                                            onChange={(e) => handleLineAmountChange(idx, 'debit', Number(e.target.value))}
                                                            placeholder="0"
                                                            className="text-xs font-mono"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <Input
                                                            type="number"
                                                            value={line.credit || ''}
                                                            onChange={(e) => handleLineAmountChange(idx, 'credit', Number(e.target.value))}
                                                            placeholder="0"
                                                            className="text-xs font-mono"
                                                        />
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRemoveManualLine(idx)}
                                                            className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-muted/40 font-bold border-t">
                                            <tr>
                                                <td className="p-2 text-right">Total:</td>
                                                <td className="p-2 font-mono text-emerald-600">
                                                    {formatCurrency(totalManualDebit)}
                                                </td>
                                                <td className="p-2 font-mono text-blue-600">
                                                    {formatCurrency(totalManualCredit)}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* BALANCE STATUS INDICATOR */}
                                <div className={`flex items-center justify-between rounded-lg p-2.5 text-xs ${
                                    isBalanced ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        {isBalanced ? (
                                            <CheckCircle2 className="h-4 w-4" />
                                        ) : (
                                            <ShieldAlert className="h-4 w-4" />
                                        )}
                                        <span className="font-semibold">
                                            {isBalanced ? 'Jurnal Seimbang (Balanced Debit = Kredit)' : `Tidak Seimbang (Selisih: ${formatCurrency(Math.abs(totalManualDebit - totalManualCredit))})`}
                                        </span>
                                    </div>
                                    <span className="text-[11px]">Validasi SAK/ETAP</span>
                                </div>
                            </div>

                            <DialogFooter className="pt-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsManualModalOpen(false)}
                                    className="text-xs"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={!isBalanced}
                                    className="text-xs cursor-pointer"
                                >
                                    Posting Jurnal
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

AccountingJournals.layout = (page: React.ReactNode) => (
    <AppLayout
        title="Jurnal Umum & Buku Besar"
        description="Audit trail lengkap seluruh transaksi debit-kredit otomatis dan jurnal manual."
        information="STAGE 2 · GENERAL LEDGER & JOURNALS"
        breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Akuntansi', href: '/admin/accounting' },
            { title: 'Jurnal Transaksi', href: '/admin/accounting/journals' },
        ]}
    >
        {page}
    </AppLayout>
);
