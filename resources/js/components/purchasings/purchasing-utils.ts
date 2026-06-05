export function getReceivings(purchasing: any) {
    return purchasing.material_receivings || [];
}

export function getReceivedQty(purchasing: any) {
    if (purchasing.received_qty !== undefined && purchasing.received_qty !== null) {
        return Number(purchasing.received_qty || 0);
    }

    return getReceivings(purchasing).reduce((total: number, item: any) => {
        return total + Number(item.qty_received || item.received_qty || item.received_qty || 0);
    }, 0);
}

export function getOrderedQty(purchasing: any) {
    return Number(
        purchasing.purchase_qty ??
        purchasing.ordered_qty ??
        purchasing.qty_bahan ??
        0
    );
}

export function getRemainingQty(purchasing: any) {
    if (purchasing.remaining_qty !== undefined && purchasing.remaining_qty !== null) {
        return Number(purchasing.remaining_qty || 0);
    }

    return Math.max(getOrderedQty(purchasing) - getReceivedQty(purchasing), 0);
}

export function getReceivingProgress(purchasing: any) {
    const qty = getOrderedQty(purchasing);

    if (!qty || qty <= 0) return 0;

    return Math.min(Math.max((getReceivedQty(purchasing) / qty) * 100, 0), 100);
}

export function getPurchasingTotal(purchasing: any) {
    return Number(purchasing.total_harga || 0);
}

export function getPurchasingStatusLabel(status?: string) {
    if (status === 'draft') return 'Draft';
    if (status === 'ordered') return 'Ordered';
    if (status === 'partial_received') return 'Partial Received';
    if (status === 'received') return 'Received';
    if (status === 'cancelled') return 'Cancelled';

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
    return purchasing.status === 'draft';
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
    return Number(job?.sample_qty || 0) + Number(job?.quantity || job?.q || 0);
}

function getTotalRequiredQty(purchasing: any) {
    return Number(
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

    if (scope === 'additional') {
        return 0;
    }

    if (type === 'sample' && scope === 'production') {
        return 0;
    }

    if (type === 'production' && scope === 'sample') {
        return 0;
    }

    if (scope === type) {
        return totalRequiredQty;
    }

    if (scope !== 'sample_and_production') {
        return 0;
    }

    const sampleQty = Number(job?.sample_qty || 0);
    const productionQty = Number(job?.quantity || job?.q || 0);

    const qty = type === 'sample' ? sampleQty : productionQty;
    const totalOrderQty = sampleQty + productionQty;

    if (qty <= 0 || totalOrderQty <= 0) {
        return 0;
    }

    return roundQty(totalRequiredQty * (qty / totalOrderQty));
}

export function getSampleReceivedQty(purchasing: any, job: any) {
    const receivedQty = getReceivedQty(purchasing);
    const sampleRequiredQty =  getRequiredQty(purchasing, job, 'sample');

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

    return Math.min(Math.max((received / required) * 100, 0), 100);
}

function roundQty(value: number, precision = 4) {
    const multiplier = Math.pow(10, precision);

    return Math.round((Number(value || 0) + Number.EPSILON) * multiplier) / multiplier;
}

export function formatMaterialQty(value: number, unit?: string) {
    const normalizedUnit = (unit || '').toLowerCase();

    const isWholeNumberUnit = ['pcs', 'pc', 'set', 'unit'].includes(normalizedUnit);

    return Number(value || 0).toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: isWholeNumberUnit ? 0 : 2,
    });
}