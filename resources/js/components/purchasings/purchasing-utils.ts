export function roundQty(value: number, precision = 4) {
    const multiplier = Math.pow(10, precision);
    return Math.round((Number(value || 0) + Number.EPSILON) * multiplier) / multiplier;
}

export function getReceivings(purchasing: any) {
    return purchasing.material_receivings || [];
}

export function getReceivedQty(purchasing: any) {
    if (purchasing.received_qty !== undefined && purchasing.received_qty !== null) {
        return roundQty(purchasing.received_qty);
    }

    // Penjumlahan rentan terhadap presisi desimal, jadi dibungkus roundQty
    const total = getReceivings(purchasing)?.filter(m => m.item_condition === 'good').reduce((total: number, item: any) => {
        return total + Number(item.qty_received || item.received_qty || 0);
    }, 0);

    return roundQty(total);
}

export function getOrderedQty(purchasing: any) {
    return roundQty(
        purchasing.purchase_qty ??
        purchasing.ordered_qty ??
        purchasing.qty_bahan ??
        0
    );
}

export function getRemainingQty(purchasing: any) {
    let remaining = 0;

    if (purchasing.remaining_qty !== undefined && purchasing.remaining_qty !== null) {
        remaining = Number(purchasing.remaining_qty || 0);
    } else {
        // Pengurangan juga rentan desimal
        remaining = Math.max(getOrderedQty(purchasing) - getReceivedQty(purchasing), 0);
    }

    // Menggunakan helper bawaan yang sudah ada agar konsisten
    return roundQty(remaining); 
}

export function getReceivingProgress(purchasing: any) {
    const qty = getOrderedQty(purchasing);

    if (!qty || qty <= 0) return 0;

    const progress = (getReceivedQty(purchasing) / qty) * 100;
    
    // Persentase dibulatkan ke 2 desimal (misal 33.3333333 -> 33.33)
    return roundQty(Math.min(Math.max(progress, 0), 100), 2);
}

export function getPurchasingTotal(purchasing: any) {
    // Total uang biasanya aman, tapi kalau mau dibulatkan ke 2 desimal juga bisa: roundQty(..., 2)
    return Number(purchasing.total_harga || 0);
}

export function getPurchasingStatusLabel(status?: string) {
    if (status === 'draft') return 'Draft';
    if (status === 'ordered') return 'Dipesan';
    if (status === 'partial_received') return 'Diterima sebagian';
    if (status === 'received') return 'Diterima';
    if (status === 'cancelled') return 'Dibatalkan';

    return status || '-';
}

export const purchasingStatusClass: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    ordered: 'bg-blue-100 text-blue-700 border-blue-200',
    partial_received: 'bg-amber-100 text-amber-700 border-amber-200',
    received: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export function canEditPurchasing(purchasing: any) {
    return !['received', 'cancelled'].includes(purchasing.status);
}

export function canDeletePurchasing(purchasing: any) {
    return getReceivings(purchasing).length === 0 && purchasing.status !== 'received';
}

export function canMarkOrdered(purchasing: any) {
    return purchasing.status === 'draft' || purchasing.status === 'ordered';
}

export function canReceiveMaterial(purchasing: any) {
    return !['received', 'cancelled'].includes(purchasing.status);
}

export function getSupplierName(purchasing: any) {
    const supplier = purchasing.supplier;

    if (!supplier) return '-';
    if (typeof supplier === 'string') return supplier;

    return supplier.nama_perusahaan || supplier.nama || supplier.name || '-';
}

function getTotalPlannedQty(job: any) {
    const total = Number(job?.sample_qty || 0) + Number(job?.quantity || job?.q || 0);
    return roundQty(total);
}

function getTotalRequiredQty(purchasing: any) {
    return roundQty(
        purchasing.required_qty ??
        purchasing.qty_bahan ??
        purchasing.purchase_qty ??
        0
    );
}

export function getRequiredQty(
    purchasing: any,
    job: any,
    type: 'sample' | 'production',
) {
    const scope = purchasing.purchase_scope || 'sample_and_production';
    const totalRequiredQty = getTotalRequiredQty(purchasing);

    if (scope === 'additional') return 0;
    if (type === 'sample' && scope === 'production') return 0;
    if (type === 'production' && (scope === 'sample' || scope === 'sample_revision')) return 0;
    
    if (scope === type || (type === 'sample' && scope === 'sample_revision')) {
        return totalRequiredQty;
    }

    if (scope !== 'sample_and_production') return 0;

    const sampleQty = Number(job?.sample_qty || 0);
    const productionQty = Number(job?.quantity || job?.q || 0);

    const qty = type === 'sample' ? sampleQty : productionQty;
    const totalOrderQty = sampleQty + productionQty;

    if (qty <= 0 || totalOrderQty <= 0) {
        return 0;
    }

    // Karena di sini ada pembagian (qty / totalOrderQty), ini sudah otomatis 
    // dilindungi roundQty dari kode Anda sebelumnya
    return roundQty(totalRequiredQty * (qty / totalOrderQty));
}

export function getSampleReceivedQty(purchasing: any, job: any) {
    const receivedQty = getReceivedQty(purchasing);
    const sampleRequiredQty = getRequiredQty(purchasing, job, 'sample');

    return roundQty(Math.min(receivedQty, sampleRequiredQty));
}

export function getProductionReceivedQty(purchasing: any, job: any) {
    const receivedQty = getReceivedQty(purchasing);
    const sampleRequiredQty = getRequiredQty(purchasing, job, 'sample');
    const productionRequiredQty = getRequiredQty(purchasing, job, 'production');

    const remainingAfterSample = Math.max(receivedQty - sampleRequiredQty, 0);

    return roundQty(Math.min(remainingAfterSample, productionRequiredQty));
}

export function getProgressPercentage(received: number, required: number) {
    if (!required || required <= 0) return 0;

    const progress = (received / required) * 100;
    // Persentase progress bar dibulatkan ke 2 desimal
    return roundQty(Math.min(Math.max(progress, 0), 100), 2);
}

export function formatMaterialQty(value: number, unit?: string) {
    const normalizedUnit = (unit || '').toLowerCase();

    if (['pcs', 'pc', 'set', 'unit'].includes(normalizedUnit)) {
        return Number(value).toLocaleString('id-ID', {
            maximumFractionDigits: 0,
        });
    }

    const abs = Math.abs(Number(value));

    let digits = 2;

    if (abs < 1) digits = 3;
    if (abs < 0.1) digits = 4;

    return Number(value).toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: digits,
    });
}