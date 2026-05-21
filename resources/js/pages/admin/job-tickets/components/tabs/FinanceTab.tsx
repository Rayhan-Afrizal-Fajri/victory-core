import React from 'react';
import type { JobTicket } from '../../types';
import SectionCard from '../SectionCard';
import { StatusBadge } from '../StatusBadge';
import SampleInvoicePaymentCard from '@/components/sample/sample-invoice-payment-card';

const FinanceTab: React.FC<{ job: JobTicket }> = ({ job }) => {
  const sampleInvoices = (job.invoices || []).filter((i) => i.title?.toLowerCase().includes('sample'));
  const productionInvoices = (job.invoices || []).filter((i) => !i.title?.toLowerCase().includes('sample'));
  const sampleApproved = (job as any).workflow_status?.sample_approved ?? false;

  return (
    <div className="space-y-4">
      {sampleApproved && (
        <SectionCard title="Invoice Produksi">
          {productionInvoices.length === 0 ? <div className="text-sm text-gray-600">Belum ada invoice produksi.</div> : (
            <ul>
              {productionInvoices.map((inv) => (
                <li key={inv.id} className="flex justify-between items-center py-2">
                  <div>
                    <div className="text-sm font-medium">{inv.title}</div>
                    <div className="text-xs text-gray-500">{inv.issued_at}</div>
                  </div>
                  <div>
                    <StatusBadge label={inv.status ?? ''} variant={inv.status === 'Paid' ? 'success' : inv.status === 'Partially Paid' ? 'warning' : 'danger'} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}
      <SectionCard title="Invoice Sampel">
        {sampleInvoices.length === 0 ? <div className="text-sm text-gray-600">Tidak ada invoice sampel.</div> : (
          <ul>
            {sampleInvoices.map((inv) => (
              <li key={inv.id} className="flex justify-between items-center py-2">
                <div>
                  <div className="text-sm font-medium">{inv.title}</div>
                  <div className="text-xs text-gray-500">{inv.issued_at}</div>
                </div>
                <div>
                  <StatusBadge label={inv.status ?? ''} variant={inv.status === 'Paid' ? 'success' : inv.status === 'Partially Paid' ? 'warning' : 'danger'} />
                </div>
              </li>
            ))}
          </ul>
        )}
        {/* <SampleInvoicePaymentCard 
          invoice={sampleInvoices}
          payments={payments}
          totalPaidVerified={totalPaidVerified}
          remainingPayment={remainingPayment}
          canSubmitPayment={canSubmitPayment}
          paymentForm={paymentForm}
          rejectPaymentForm={rejectPaymentForm}
          rejectPaymentId={rejectPaymentId}
          setRejectPaymentId={setRejectPaymentId}
          onSubmitPayment={submitPayment}
          onVerifyPayment={verifyPayment}
          onRejectPayment={rejectPayment}
        /> */}
      </SectionCard>
    </div>
  );
};

export default FinanceTab;
