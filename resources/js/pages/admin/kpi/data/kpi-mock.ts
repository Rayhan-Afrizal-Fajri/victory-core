export interface KpiMetric {
    code: string;
    name: string;
    dimension: 'Produksi' | 'Kualitas' | 'Finansial' | 'Komersial' | 'Supply Chain';
    currentValue: number;
    targetValue: number;
    unit: string;
    trend: 'up' | 'down' | 'neutral';
    trendValue: string;
    status: 'success' | 'warning' | 'danger';
    description: string;
}

export const mockKpiMetrics: KpiMetric[] = [
    {
        code: 'OTD_RATE',
        name: 'On-Time Delivery Rate (OTD %)',
        dimension: 'Produksi',
        currentValue: 94.2,
        targetValue: 95.0,
        unit: '%',
        trend: 'up',
        trendValue: '+1.4% vs bulan lalu',
        status: 'warning',
        description: 'Persentase PO yang dikirim tepat sebelum deadline waktu pelanggan',
    },
    {
        code: 'FTPR_RATE',
        name: 'First Time Pass Rate (FTPR %)',
        dimension: 'Kualitas',
        currentValue: 96.8,
        targetValue: 95.0,
        unit: '%',
        trend: 'up',
        trendValue: '+0.8% dari target',
        status: 'success',
        description: 'Barang lolos QC pertama kali tanpa perlu perbaikan (rework)',
    },
    {
        code: 'DEFECT_RATE',
        name: 'Defect / Scrap Rate (%)',
        dimension: 'Kualitas',
        currentValue: 1.8,
        targetValue: 2.5,
        unit: '%',
        trend: 'down',
        trendValue: '-0.4% lebih hemat',
        status: 'success',
        description: 'Tingkat kegagalan produk yang memerlukan bongkar jahit atau potong ulang',
    },
    {
        code: 'GPM_PCT',
        name: 'Gross Profit Margin (GPM %)',
        dimension: 'Finansial',
        currentValue: 38.4,
        targetValue: 35.0,
        unit: '%',
        trend: 'up',
        trendValue: '+3.4% di atas baseline',
        status: 'success',
        description: 'Persentase keuntungan kotor setelah dipotong seluruh HPP riil pabrik',
    },
    {
        code: 'WIN_RATE',
        name: 'Quotation Win Rate (%)',
        dimension: 'Komersial',
        currentValue: 68.5,
        targetValue: 65.0,
        unit: '%',
        trend: 'up',
        trendValue: '24 dari 35 penawaran closing',
        status: 'success',
        description: 'Rasio penawaran harga yang disetujui klien menjadi pesanan aktif',
    },
    {
        code: 'MAT_REJECT',
        name: 'Material Reject Rate (%)',
        dimension: 'Supply Chain',
        currentValue: 0.8,
        targetValue: 1.0,
        unit: '%',
        trend: 'down',
        trendValue: 'Kondisi bahan sangat prima',
        status: 'success',
        description: 'Persentase kain & aksesoris rusak saat penerimaan barang di gudang',
    },
];

export interface KpiAlert {
    id: string;
    level: 'warning' | 'danger';
    title: string;
    message: string;
    entityRef: string;
    date: string;
}

export const mockKpiAlerts: KpiAlert[] = [
    {
        id: 'ALT-01',
        level: 'danger',
        title: 'Mendekati Deadline Pengiriman (< 48 Jam)',
        message: 'PO-2026-10-044 (Kemeja PDH 300 pcs) jatuh tempo pada 28 Okt 2026. Progres stasiun sewing masih 65%.',
        entityRef: 'PO-2026-10-044',
        date: 'Hari ini 09:15',
    },
    {
        id: 'ALT-02',
        level: 'warning',
        title: 'Lonjakan Scrap Bahan Kain',
        message: 'Artikel Heavyweight Oversize PO-2026-10-041 mencatat scrap Rp 850.000 akibat penyusutan kain saat cutting.',
        entityRef: 'PO-2026-10-041',
        date: 'Kemarin 16:40',
    },
];

export interface ThroughputItem {
    center: string;
    currentPcs: number;
    targetPcs: number;
    completionPct: number;
    activeWorkers: number;
    leadOperator: string;
}

export const mockThroughput: ThroughputItem[] = [
    { center: '1. Meja Potong (Cutting)', currentPcs: 1450, targetPcs: 1400, completionPct: 103.5, activeWorkers: 4, leadOperator: 'Pak Asep Komar' },
    { center: '2. Jalur Jahit (Sewing)', currentPcs: 1220, targetPcs: 1300, completionPct: 93.8, activeWorkers: 12, leadOperator: 'Bu Siti Rahayu' },
    { center: '3. QC & Finishing / Buang Benang', currentPcs: 1180, targetPcs: 1200, completionPct: 98.3, activeWorkers: 5, leadOperator: 'Bu Nur Aisyah' },
    { center: '4. Steam & Packing Polybag', currentPcs: 1150, targetPcs: 1150, completionPct: 100.0, activeWorkers: 3, leadOperator: 'Kang Deni' },
];

export interface DefectParetoItem {
    reason: string;
    count: number;
    pct: number;
    cumulativePct: number;
    correctiveAction: string;
}

export const mockDefectPareto: DefectParetoItem[] = [
    { reason: 'Jahitan Melompat (Skipped Stitch)', count: 42, pct: 41.2, cumulativePct: 41.2, correctiveAction: 'Ganti jarum nomor DBx1 #11 dan setting timing looper mesin jahit' },
    { reason: 'Noda Minyak Pelumas Mesin', count: 26, pct: 25.5, cumulativePct: 66.7, correctiveAction: 'Pasang pelindung penampung oli dan bersihkan meja kerja sewing' },
    { reason: 'Sablon DTF Kerut / Kurang Matang', count: 16, pct: 15.7, cumulativePct: 82.4, correctiveAction: 'Kalibrasi suhu heat press ke 160°C selama 15 detik konstan' },
    { reason: 'Ukuran Pola Melenceng > 1.5 cm', count: 11, pct: 10.8, cumulativePct: 93.2, correctiveAction: 'Gunakan pemberat kain saat memotong tumpukan kain > 50 ply' },
    { reason: 'Kancing Lepas / Jahitan Longgar', count: 7, pct: 6.8, cumulativePct: 100.0, correctiveAction: 'Kencangkan tension benang mesin pasang kancing elektronik' },
];

export interface SupplierScorecardItem {
    id: string;
    name: string;
    category: string;
    totalOrders: number;
    onTimeDeliveryPct: number;
    qualityPassPct: number;
    priceCompetitiveness: number;
    compositeScore: number;
    grade: 'A' | 'B' | 'C';
}

export const mockSupplierScorecards: SupplierScorecardItem[] = [
    { id: 'SUP-01', name: 'CV Sumber Tekstil Bandung', category: 'Kain Cotton & Fleece', totalOrders: 18, onTimeDeliveryPct: 98.5, qualityPassPct: 99.2, priceCompetitiveness: 95.0, compositeScore: 97.6, grade: 'A' },
    { id: 'SUP-02', name: 'Sablon Express DTF Cimahi', category: 'Vendor Makloon Sablon', totalOrders: 24, onTimeDeliveryPct: 94.0, qualityPassPct: 96.5, priceCompetitiveness: 92.0, compositeScore: 94.2, grade: 'A' },
    { id: 'SUP-03', name: 'Toko Kancing & Aksesoris Maju', category: 'Trims, Kancing, Zipper', totalOrders: 12, onTimeDeliveryPct: 91.5, qualityPassPct: 97.0, priceCompetitiveness: 90.0, compositeScore: 92.8, grade: 'B' },
    { id: 'SUP-04', name: 'Bordir Komputer Prima Garut', category: 'Vendor Makloon Bordir', totalOrders: 9, onTimeDeliveryPct: 88.0, qualityPassPct: 93.5, priceCompetitiveness: 88.0, compositeScore: 89.8, grade: 'B' },
];

export interface WorkerLeaderboardItem {
    id: string;
    name: string;
    role: string;
    workCenter: string;
    completedPcs: number;
    defectContributionPct: number;
    punctualityScore: number;
    accumulatedWage: number;
    rank: number;
}

export const mockWorkerLeaderboard: WorkerLeaderboardItem[] = [
    { id: 'WRK-01', name: 'Pak Asep Komarudin', role: 'Operator Potong Kepala', workCenter: 'Cutting', completedPcs: 4850, defectContributionPct: 0.2, punctualityScore: 99.0, accumulatedWage: 4850000, rank: 1 },
    { id: 'WRK-02', name: 'Bu Siti Rahayu', role: 'Operator Jahit Senior', workCenter: 'Sewing', completedPcs: 3920, defectContributionPct: 0.4, punctualityScore: 98.5, accumulatedWage: 4704000, rank: 2 },
    { id: 'WRK-03', name: 'Kang Deni Setiawan', role: 'Operator Jahit Obras', workCenter: 'Sewing', completedPcs: 3680, defectContributionPct: 0.6, punctualityScore: 96.0, accumulatedWage: 4048000, rank: 3 },
    { id: 'WRK-04', name: 'Bu Nur Aisyah', role: 'QC & Buang Benang', workCenter: 'Finishing', completedPcs: 4200, defectContributionPct: 0.1, punctualityScore: 97.5, accumulatedWage: 3360000, rank: 4 },
    { id: 'WRK-05', name: 'Pak Agus Supriatna', role: 'Inspector QC Akhir', workCenter: 'QC Board', completedPcs: 4150, defectContributionPct: 0.0, punctualityScore: 98.0, accumulatedWage: 3500000, rank: 5 },
];
