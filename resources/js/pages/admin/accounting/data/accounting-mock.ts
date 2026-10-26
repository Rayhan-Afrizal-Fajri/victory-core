export interface ChartOfAccountItem {
    code: string;
    name: string;
    category: 'asset' | 'liability' | 'equity' | 'revenue' | 'cogs' | 'expense';
    subCategory: string;
    normalBalance: 'debit' | 'credit';
    balance: number;
    description?: string;
    isHeader?: boolean;
}

export const mockCOA: ChartOfAccountItem[] = [
    // 1-0000 ASET
    { code: '1-0000', name: 'ASET', category: 'asset', subCategory: 'Header', normalBalance: 'debit', balance: 284500000, isHeader: true },
    { code: '1-1000', name: 'Aset Lancar', category: 'asset', subCategory: 'Header', normalBalance: 'debit', balance: 172500000, isHeader: true },
    { code: '1-1110', name: 'Kas Operasional (Petty Cash Pabrik)', category: 'asset', subCategory: 'Kas & Bank', normalBalance: 'debit', balance: 8500000 },
    { code: '1-1120', name: 'Bank BCA Operasional (731-0982-xxx)', category: 'asset', subCategory: 'Kas & Bank', normalBalance: 'debit', balance: 74200000 },
    { code: '1-1130', name: 'Bank Mandiri Penerimaan (131-00-192-xxx)', category: 'asset', subCategory: 'Kas & Bank', normalBalance: 'debit', balance: 35800000 },
    { code: '1-1210', name: 'Piutang Usaha Pelanggan Produksi', category: 'asset', subCategory: 'Piutang', normalBalance: 'debit', balance: 28400000 },
    { code: '1-1220', name: 'Piutang Pelanggan Sample', category: 'asset', subCategory: 'Piutang', normalBalance: 'debit', balance: 2600000 },
    { code: '1-1310', name: 'Persediaan Bahan Baku (Kain/Fabric)', category: 'asset', subCategory: 'Persediaan', normalBalance: 'debit', balance: 14800000 },
    { code: '1-1320', name: 'Persediaan Aksesoris & Trims', category: 'asset', subCategory: 'Persediaan', normalBalance: 'debit', balance: 4200000 },
    { code: '1-1330', name: 'Barang Dalam Proses (WIP)', category: 'asset', subCategory: 'Persediaan', normalBalance: 'debit', balance: 4000000 },
    { code: '1-2000', name: 'Aset Tetap', category: 'asset', subCategory: 'Header', normalBalance: 'debit', balance: 112000000, isHeader: true },
    { code: '1-2100', name: 'Mesin Jahit, Obras & Cutting Pabrik', category: 'asset', subCategory: 'Aset Tetap', normalBalance: 'debit', balance: 125000000 },
    { code: '1-2190', name: 'Akumulasi Penyusutan Mesin Pabrik', category: 'asset', subCategory: 'Aset Tetap', normalBalance: 'credit', balance: -22000000 },
    { code: '1-2200', name: 'Peralatan Kantor & Komputer', category: 'asset', subCategory: 'Aset Tetap', normalBalance: 'debit', balance: 15000000 },
    { code: '1-2290', name: 'Akumulasi Penyusutan Peralatan Kantor', category: 'asset', subCategory: 'Aset Tetap', normalBalance: 'credit', balance: -6000000 },

    // 2-0000 KEWAJIBAN / LIABILITAS
    { code: '2-0000', name: 'KEWAJIBAN', category: 'liability', subCategory: 'Header', normalBalance: 'credit', balance: 46700000, isHeader: true },
    { code: '2-1110', name: 'Hutang Supplier Bahan Baku', category: 'liability', subCategory: 'Hutang Usaha', normalBalance: 'credit', balance: 18500000 },
    { code: '2-1120', name: 'Hutang Supplier Aksesoris', category: 'liability', subCategory: 'Hutang Usaha', normalBalance: 'credit', balance: 3200000 },
    { code: '2-1130', name: 'Hutang Vendor Makloon (Sablon & Bordir)', category: 'liability', subCategory: 'Hutang Usaha', normalBalance: 'credit', balance: 6400000 },
    { code: '2-1210', name: 'Uang Muka Pesanan Produksi (DP Customer)', category: 'liability', subCategory: 'Uang Muka Penjualan', normalBalance: 'credit', balance: 14200000 },
    { code: '2-1310', name: 'Hutang Upah Borongan Worker Pabrik', category: 'liability', subCategory: 'Hutang Biaya', normalBalance: 'credit', balance: 4400000 },

    // 3-0000 EKUITAS
    { code: '3-0000', name: 'EKUITAS & MODAL', category: 'equity', subCategory: 'Header', normalBalance: 'credit', balance: 237800000, isHeader: true },
    { code: '3-1000', name: 'Modal Disetor Pemilik (Owner Capital)', category: 'equity', subCategory: 'Modal', normalBalance: 'credit', balance: 180000000 },
    { code: '3-2000', name: 'Laba Ditahan (Retained Earnings)', category: 'equity', subCategory: 'Modal', normalBalance: 'credit', balance: 32500000 },
    { code: '3-3000', name: 'Laba Periode Berjalan (Current Earnings)', category: 'equity', subCategory: 'Laba Rugi', normalBalance: 'credit', balance: 25300000 },

    // 4-0000 PENDAPATAN
    { code: '4-0000', name: 'PENDAPATAN USAHA', category: 'revenue', subCategory: 'Header', normalBalance: 'credit', balance: 98400000, isHeader: true },
    { code: '4-1000', name: 'Pendapatan Penjualan Produksi (Pakaian Jadi)', category: 'revenue', subCategory: 'Pendapatan Utama', normalBalance: 'credit', balance: 92100000 },
    { code: '4-2000', name: 'Pendapatan Pembuatan Sample Prototyping', category: 'revenue', subCategory: 'Pendapatan Sample', normalBalance: 'credit', balance: 4800000 },
    { code: '4-3000', name: 'Pendapatan Jasa Pengiriman & Ongkir', category: 'revenue', subCategory: 'Pendapatan Lain', normalBalance: 'credit', balance: 1500000 },

    // 5-0000 HPP / COGS
    { code: '5-0000', name: 'HARGA POKOK PENJUALAN (HPP)', category: 'cogs', subCategory: 'Header', normalBalance: 'debit', balance: 56900000, isHeader: true },
    { code: '5-1100', name: 'Biaya Bahan Baku Utama (Kain Cotton Combed/Fleece)', category: 'cogs', subCategory: 'Biaya Material', normalBalance: 'debit', balance: 31200000 },
    { code: '5-1200', name: 'Biaya Aksesoris & Trims (Kancing, Label, Hangtag)', category: 'cogs', subCategory: 'Biaya Material', normalBalance: 'debit', balance: 4800000 },
    { code: '5-2000', name: 'Biaya Tenaga Kerja Langsung (Upah Borongan)', category: 'cogs', subCategory: 'BTKL', normalBalance: 'debit', balance: 12400000 },
    { code: '5-3100', name: 'Biaya Makloon Sablon DTF / Manual', category: 'cogs', subCategory: 'Subkontrak', normalBalance: 'debit', balance: 5200000 },
    { code: '5-3200', name: 'Biaya Makloon Bordir Komputer', category: 'cogs', subCategory: 'Subkontrak', normalBalance: 'debit', balance: 2100000 },
    { code: '5-4000', name: 'Biaya Cacat & Scrap / Rework', category: 'cogs', subCategory: 'Waste/Defect', normalBalance: 'debit', balance: 1200000 },

    // 6-0000 BEBAN OPERASIONAL (OPEX)
    { code: '6-0000', name: 'BEBAN OPERASIONAL (OPEX)', category: 'expense', subCategory: 'Header', normalBalance: 'debit', balance: 16200000, isHeader: true },
    { code: '6-1000', name: 'Beban Gaji Staf Kantor & QC Tetap', category: 'expense', subCategory: 'Gaji', normalBalance: 'debit', balance: 8500000 },
    { code: '6-2000', name: 'Beban Sewa Workshop Pabrik', category: 'expense', subCategory: 'Fasilitas', normalBalance: 'debit', balance: 3500000 },
    { code: '6-3000', name: 'Beban Listrik Industri & Internet', category: 'expense', subCategory: 'Utilitas', normalBalance: 'debit', balance: 2100000 },
    { code: '6-5000', name: 'Beban Pemeliharaan & Jarum Mesin', category: 'expense', subCategory: 'Workshop', normalBalance: 'debit', balance: 900000 },
    { code: '6-7000', name: 'Beban ATK & Konsumsi Workshop', category: 'expense', subCategory: 'Umum', normalBalance: 'debit', balance: 1200000 },
];

export interface JournalLine {
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
}

export interface JournalEntry {
    id: string;
    entryNumber: string;
    date: string;
    referenceType: 'invoice' | 'payment' | 'receiving' | 'production_run' | 'payroll' | 'expense' | 'manual';
    referenceNumber: string;
    jobTicketNo?: string;
    description: string;
    lines: JournalLine[];
    totalDebit: number;
    totalCredit: number;
    isAuto: boolean;
    status: 'posted' | 'draft';
}

export const mockJournals: JournalEntry[] = [
    {
        id: 'JE-001',
        entryNumber: 'JE/2026/10/0128',
        date: '2026-10-25',
        referenceType: 'payment',
        referenceNumber: 'PAY-2026-10-092',
        jobTicketNo: 'PO-2026-10-042',
        description: 'Penerimaan Pelunasan Invoice #INV-2026-10-042 dari CV Distro Bandung',
        isAuto: true,
        status: 'posted',
        lines: [
            { accountCode: '1-1120', accountName: 'Bank BCA Operasional', debit: 16250000, credit: 0 },
            { accountCode: '1-1210', accountName: 'Piutang Usaha Pelanggan Produksi', debit: 0, credit: 16250000 },
        ],
        totalDebit: 16250000,
        totalCredit: 16250000,
    },
    {
        id: 'JE-002',
        entryNumber: 'JE/2026/10/0127',
        date: '2026-10-24',
        referenceType: 'production_run',
        referenceNumber: 'PR-2026-10-019',
        jobTicketNo: 'PO-2026-10-039',
        description: 'Pengakuan HPP Barang Jadi Selesai Dikirim PO-2026-10-039 (Kaos Cotton 24s 500 pcs)',
        isAuto: true,
        status: 'posted',
        lines: [
            { accountCode: '5-1100', accountName: 'Biaya Bahan Baku Utama', debit: 14500000, credit: 0 },
            { accountCode: '5-2000', accountName: 'Biaya Tenaga Kerja Langsung', debit: 4250000, credit: 0 },
            { accountCode: '5-3100', accountName: 'Biaya Makloon Sablon DTF', debit: 2500000, credit: 0 },
            { accountCode: '1-1330', accountName: 'Barang Dalam Proses (WIP)', debit: 0, credit: 21250000 },
        ],
        totalDebit: 21250000,
        totalCredit: 21250000,
    },
    {
        id: 'JE-003',
        entryNumber: 'JE/2026/10/0126',
        date: '2026-10-24',
        referenceType: 'receiving',
        referenceNumber: 'RCV-2026-10-064',
        jobTicketNo: 'PO-2026-10-043',
        description: 'Penerimaan Kain Cotton Combed 30s Reaktif 12 Roll dari CV Sumber Tekstil',
        isAuto: true,
        status: 'posted',
        lines: [
            { accountCode: '1-1310', accountName: 'Persediaan Bahan Baku (Kain)', debit: 18500000, credit: 0 },
            { accountCode: '2-1110', accountName: 'Hutang Supplier Bahan Baku', debit: 0, credit: 18500000 },
        ],
        totalDebit: 18500000,
        totalCredit: 18500000,
    },
    {
        id: 'JE-004',
        entryNumber: 'JE/2026/10/0125',
        date: '2026-10-23',
        referenceType: 'payroll',
        referenceNumber: 'PAYROLL-W42',
        jobTicketNo: 'PO-2026-10-040',
        description: 'Pencatatan Akumulasi Upah Borongan Jahit & Potong Periode Minggu Ke-4 Oktober',
        isAuto: true,
        status: 'posted',
        lines: [
            { accountCode: '1-1330', accountName: 'Barang Dalam Proses (WIP - Labor)', debit: 5850000, credit: 0 },
            { accountCode: '2-1310', accountName: 'Hutang Upah Borongan Worker Pabrik', debit: 0, credit: 5850000 },
        ],
        totalDebit: 5850000,
        totalCredit: 5850000,
    },
    {
        id: 'JE-005',
        entryNumber: 'JE/2026/10/0124',
        date: '2026-10-22',
        referenceType: 'expense',
        referenceNumber: 'EXP-2026-10-048',
        description: 'Pembayaran Beban Listrik Industri PLN Pabrik Bulan Oktober 2026',
        isAuto: false,
        status: 'posted',
        lines: [
            { accountCode: '6-3000', accountName: 'Beban Listrik Industri & Internet', debit: 2100000, credit: 0 },
            { accountCode: '1-1120', accountName: 'Bank BCA Operasional', debit: 0, credit: 2100000 },
        ],
        totalDebit: 2100000,
        totalCredit: 2100000,
    },
    {
        id: 'JE-006',
        entryNumber: 'JE/2026/10/0123',
        date: '2026-10-21',
        referenceType: 'invoice',
        referenceNumber: 'INV-2026-10-044',
        jobTicketNo: 'PO-2026-10-044',
        description: 'Penerbitan Invoice DP 50% Pembuatan Kemeja Tactical Komunitas (300 pcs)',
        isAuto: true,
        status: 'posted',
        lines: [
            { accountCode: '1-1210', accountName: 'Piutang Usaha Pelanggan Produksi', debit: 14250000, credit: 0 },
            { accountCode: '2-1210', accountName: 'Uang Muka Pesanan Produksi (DP Customer)', debit: 0, credit: 14250000 },
        ],
        totalDebit: 14250000,
        totalCredit: 14250000,
    },
];

export interface JobOrderCostItem {
    id: string;
    jobTicketNo: string;
    customer: string;
    productName: string;
    qty: number;
    sellingPrice: number;
    revenue: number;
    // Costs
    estBOMCost: number;
    actMaterialCost: number;
    actLaborCost: number;
    actSubconCost: number;
    actScrapCost: number;
    totalActualCost: number;
    // Calculated
    varianceAmount: number;
    variancePercent: number;
    grossProfit: number;
    grossMarginPercent: number;
    status: 'completed' | 'in_production';
}

export const mockJobCosting: JobOrderCostItem[] = [
    {
        id: 'JOC-01',
        jobTicketNo: 'PO-2026-10-039',
        customer: 'PT Sentosa Kreasi',
        productName: 'Kaos Cotton Combed 24s DTF (500 pcs)',
        qty: 500,
        sellingPrice: 65000,
        revenue: 32500000,
        estBOMCost: 20500000,
        actMaterialCost: 13800000,
        actLaborCost: 3950000,
        actSubconCost: 2200000,
        actScrapCost: 350000,
        totalActualCost: 20300000,
        varianceAmount: -200000, // Hemat
        variancePercent: -0.98,
        grossProfit: 12200000,
        grossMarginPercent: 37.54,
        status: 'completed',
    },
    {
        id: 'JOC-02',
        jobTicketNo: 'PO-2026-10-041',
        customer: 'CV Distro Bandung',
        productName: 'T-Shirt Heavyweight Oversize 20s (600 pcs)',
        qty: 600,
        sellingPrice: 78000,
        revenue: 46800000,
        estBOMCost: 27500000,
        actMaterialCost: 18900000,
        actLaborCost: 4800000,
        actSubconCost: 3100000,
        actScrapCost: 850000,
        totalActualCost: 27650000,
        varianceAmount: 150000, // Sedikit boros karena scrap
        variancePercent: 0.55,
        grossProfit: 19150000,
        grossMarginPercent: 40.92,
        status: 'completed',
    },
    {
        id: 'JOC-03',
        jobTicketNo: 'PO-2026-10-042',
        customer: 'Komunitas Motor Retro',
        productName: 'Jaket Hoodie Fleece Tebal Bordir (250 pcs)',
        qty: 250,
        sellingPrice: 145000,
        revenue: 36250000,
        estBOMCost: 23200000,
        actMaterialCost: 14200000,
        actLaborCost: 3800000,
        actSubconCost: 4500000,
        actScrapCost: 200000,
        totalActualCost: 22700000,
        varianceAmount: -500000,
        variancePercent: -2.16,
        grossProfit: 13550000,
        grossMarginPercent: 37.38,
        status: 'completed',
    },
    {
        id: 'JOC-04',
        jobTicketNo: 'PO-2026-10-044',
        customer: 'SMA Nusantara 1',
        productName: 'Kemeja PDH Drill Bordir Komputer (300 pcs)',
        qty: 300,
        sellingPrice: 95000,
        revenue: 28500000,
        estBOMCost: 17800000,
        actMaterialCost: 11200000,
        actLaborCost: 3100000,
        actSubconCost: 2800000,
        actScrapCost: 150000,
        totalActualCost: 17250000,
        varianceAmount: -550000,
        variancePercent: -3.09,
        grossProfit: 11250000,
        grossMarginPercent: 39.47,
        status: 'in_production',
    },
];

export interface ReceivableItem {
    id: string;
    invoiceNo: string;
    jobTicketNo: string;
    customer: string;
    invoiceDate: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    daysOverdue: number;
    agingBucket: 'current' | '1-30' | '31-60' | '61-90' | '>90';
    status: 'unpaid' | 'partial' | 'overdue';
}

export const mockReceivables: ReceivableItem[] = [
    {
        id: 'AR-01',
        invoiceNo: 'INV-2026-10-044',
        jobTicketNo: 'PO-2026-10-044',
        customer: 'SMA Nusantara 1',
        invoiceDate: '2026-10-21',
        dueDate: '2026-10-28',
        totalAmount: 28500000,
        paidAmount: 14250000,
        remainingAmount: 14250000,
        daysOverdue: 0,
        agingBucket: 'current',
        status: 'partial',
    },
    {
        id: 'AR-02',
        invoiceNo: 'INV-2026-10-040',
        jobTicketNo: 'PO-2026-10-040',
        customer: 'Studio Seni Visual',
        invoiceDate: '2026-10-10',
        dueDate: '2026-10-20',
        totalAmount: 18500000,
        paidAmount: 9250000,
        remainingAmount: 9250000,
        daysOverdue: 6,
        agingBucket: '1-30',
        status: 'overdue',
    },
    {
        id: 'AR-03',
        invoiceNo: 'INV-2026-09-082',
        jobTicketNo: 'PO-2026-09-028',
        customer: 'Event Organizer Harmoni',
        invoiceDate: '2026-09-15',
        dueDate: '2026-09-25',
        totalAmount: 12400000,
        paidAmount: 7500000,
        remainingAmount: 4900000,
        daysOverdue: 31,
        agingBucket: '31-60',
        status: 'overdue',
    },
    {
        id: 'AR-04',
        invoiceNo: 'INV-2026-10-046',
        jobTicketNo: 'PO-2026-10-046',
        customer: 'PT Mandiri Sejahtera',
        invoiceDate: '2026-10-24',
        dueDate: '2026-10-31',
        totalAmount: 15600000,
        paidAmount: 13000000,
        remainingAmount: 2600000,
        daysOverdue: 0,
        agingBucket: 'current',
        status: 'partial',
    },
];

export interface PayableItem {
    id: string;
    billNumber: string;
    supplier: string;
    category: 'Bahan Baku' | 'Aksesoris' | 'Vendor Makloon' | 'Ekspedisi';
    poRef: string;
    billDate: string;
    dueDate: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    daysOverdue: number;
    status: 'unpaid' | 'partial' | 'paid';
}

export const mockPayables: PayableItem[] = [
    {
        id: 'AP-01',
        billNumber: 'BILL/2026/10/0045',
        supplier: 'CV Sumber Tekstil Bandung',
        category: 'Bahan Baku',
        poRef: 'PO-2026-10-043',
        billDate: '2026-10-24',
        dueDate: '2026-11-07',
        totalAmount: 18500000,
        paidAmount: 0,
        remainingAmount: 18500000,
        daysOverdue: 0,
        status: 'unpaid',
    },
    {
        id: 'AP-02',
        billNumber: 'BILL/2026/10/0042',
        supplier: 'Sablon Express DTF Cimahi',
        category: 'Vendor Makloon',
        poRef: 'PO-2026-10-041',
        billDate: '2026-10-20',
        dueDate: '2026-10-27',
        totalAmount: 4200000,
        paidAmount: 2000000,
        remainingAmount: 2200000,
        daysOverdue: 0,
        status: 'partial',
    },
    {
        id: 'AP-03',
        billNumber: 'BILL/2026/10/0038',
        supplier: 'Bordir Komputer Prima Garut',
        category: 'Vendor Makloon',
        poRef: 'PO-2026-10-039',
        billDate: '2026-10-15',
        dueDate: '2026-10-22',
        totalAmount: 3200000,
        paidAmount: 0,
        remainingAmount: 3200000,
        daysOverdue: 4,
        status: 'unpaid',
    },
    {
        id: 'AP-04',
        billNumber: 'BILL/2026/10/0041',
        supplier: 'Toko Kancing & Aksesoris Maju',
        category: 'Aksesoris',
        poRef: 'PO-2026-10-042',
        billDate: '2026-10-18',
        dueDate: '2026-11-01',
        totalAmount: 3200000,
        paidAmount: 1500000,
        remainingAmount: 1700000,
        daysOverdue: 0,
        status: 'partial',
    },
];
