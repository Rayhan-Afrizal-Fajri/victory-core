export const invoiceStatusClass: Record<string, string> = {
    unpaid: 'bg-red-100 text-red-700 border-red-200',
    Unpaid: 'bg-red-100 text-red-700 border-red-200',

    partially_paid: 'bg-amber-100 text-amber-700 border-amber-200',
    'Partially Paid': 'bg-amber-100 text-amber-700 border-amber-200',

    paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',

    cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
    Cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const paymentStatusClass: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
};

export function getInvoiceStatusLabel(status?: string) {
    if (status === 'paid' || status === 'Paid') return 'Lunas';
    if (status === 'partially_paid' || status === 'Partially Paid') return 'Sebagian';
    if (status === 'unpaid' || status === 'Unpaid') return 'Belum Lunas';
    if (status === 'cancelled' || status === 'Cancelled') return 'Dibatalkan';

    return status || '-';
}

export function getInvoiceNumber(invoice: any) {
    return invoice?.no_invoice || invoice?.invoiceNumber || invoice?.title || 'Invoice';
}

export function getInvoiceTotal(invoice: any) {
    return Number(invoice?.total_tagihan || invoice?.amount || invoice?.total || 0);
}

export function getInvoicePayments(invoice: any) {
    return invoice?.payments || invoice?.payment || [];
}

export function getVerifiedPaid(invoice: any) {
    return getInvoicePayments(invoice)
        .filter((payment: any) => payment.status === 'verified')
        .reduce((total: number, payment: any) => {
            return total + Number(payment.jumlah_bayar || payment.amount || 0);
        }, 0);
}

export function getRemainingPayment(invoice: any) {
    return Math.max(getInvoiceTotal(invoice) - getVerifiedPaid(invoice), 0);
}

export function getPaymentProgress(invoice: any) {
    const total = getInvoiceTotal(invoice);
    const paid = getVerifiedPaid(invoice);

    if (!total || total <= 0) return 0;

    return Math.min(Math.max((paid / total) * 100, 0), 100);
}

export function isInvoicePaid(invoice: any) {
    return ['paid', 'Paid'].includes(invoice?.status_tagihan || invoice?.status);
}

export function isInvoiceCancelled(invoice: any) {
    return ['cancelled', 'Cancelled'].includes(invoice?.status_tagihan || invoice?.status);
}

export function hasVerifiedPayment(invoice: any) {
    return getInvoicePayments(invoice).some((payment: any) => payment.status === 'verified');
}

export function getInvoiceCategory(invoice: any) {
    const category = invoice?.kategori_invoice;

    if (category) return category;

    const text = `${invoice?.title || ''} ${invoice?.no_invoice || ''}`.toLowerCase();

    if (text.includes('sample')) return 'sample';
    if (text.includes('prod')) return 'production';
    if (text.includes('final')) return 'final_billing';

    return 'other';
}

export function getInvoiceCategoryLabel(invoice: any) {
    const category = getInvoiceCategory(invoice);

    if (category === 'sample') return 'Sample';
    if (category === 'production') return 'Production';
    if (category === 'final_billing') return 'Final Billing';

    return 'Other';
}