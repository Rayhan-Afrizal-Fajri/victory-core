import React from 'react';
import JobTicketHeader from './components/JobTicketHeader';
import WorkflowTimeline from './components/WorkflowTimeline';
import WorkflowTabs from './components/WorkflowTabs';
import { JobTicket } from './types';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import jobTickets from '@/routes/job-tickets';
import StatusBadge from './components/StatusBadge';

type Props = { pesanan?: JobTicket };

const dummyJobTicket: JobTicket = {
  id: 1,
  order_number: 'JT-2026-0001',
  customer: { name: 'PT. Contoh' },
  product_name: 'Kemeja Kerja',
  deadline: '2026-06-01',
  status: 'Produksi',
  workflow_status: {
    design_approved: true,
    sample_approved: false,
    production_dp_paid: false,
    materials_distributed: false,
    production_completed: false,
    qc_completed: false,
    packing_completed: false,
    final_payment_paid: false,
    delivered: false,
  },
  designs: [{ id: 1, file_path: 'design_v1.pdf', note: 'Initial', approved: true, created_at: '2026-05-10' }],
  samples: [{ id: 1, qty: 2, status: 'pending' }],
  invoices: [
    { id: 1, title: 'Invoice Sampel', amount: 500000, status: 'Unpaid', issued_at: '2026-05-12' },
    { id: 2, title: 'Invoice Produksi', amount: 2000000, status: 'Unpaid', issued_at: '2026-05-20' },
  ],
  payments: [],
  purchasings: [
    { id: 1, item: 'Kain Katun', supplier: 'PT. Supplier', ordered_qty: 100, received_qty: 20 },
  ],
  productionProgress: { percent: 20, phase: 'Cutting', checklist: ['Potong', 'Sew'] },
  qc: { reject_count: 0 },
  packing: {},
  delivery: {},
  activity_logs: [{ id: 1, actor: 'Andi', role: 'CS', action: 'Buat job', note: 'Order masuk', created_at: '2026-05-10' }],
};

export default function Show({ pesanan }: Props) {
  const jobTicket = pesanan ?? dummyJobTicket;

  return (
    <>
        <Head title={`Job Ticket — ${jobTicket.order_number}`} />

        <WorkflowTabs job={jobTicket} />

    </>
  );
}


// Perbarui fungsi Show.layout di bagian paling bawah file Show.tsx Anda menjadi seperti ini:

Show.layout = (page: React.ReactElement<Props>) => {
    const pesanan = page.props?.pesanan;

    const noJobTicket =
        pesanan?.order_number || 'Detail Tiket';
    
    const progress =
        pesanan?.productionProgress?.percent ??
        (pesanan as any)?.progressPercent ??
        0;

    const priority =
        pesanan?.productionProgress?.prioritas ??
        (pesanan as any)?.priority ??
        'Normal';

    return (
        <AppLayout
            title={noJobTicket}
            description={`${pesanan?.customer?.name ?? 'Customer'} · ${pesanan?.product_name ?? 'Produk'}`}
            information="No. Job Ticket"
            breadcrumbs={[
                {
                    title: 'Job Tickets',
                    href: jobTickets.index(),
                },
                {
                    title: noJobTicket,
                    href: pesanan
                        ? jobTickets.show(pesanan.id)
                        : '#',
                },
            ]}
            actions={
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Deadline</div>
                        <div className="font-medium">{pesanan?.deadline ?? '—'}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Progress</div>
                        <div className="w-40 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div className="h-3 bg-green-500" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{progress}%</div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Prioritas</div>
                        <StatusBadge label={priority ?? 'Normal'} variant={priority === 'High' || priority === 'Urgent' ? 'warning' : 'default'} />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500">Status</div>
                        <StatusBadge label={pesanan?.status ?? 'Aktif'} variant={pesanan?.status === 'Done' ? 'success' : 'info'} />
                    </div>
                </div>
            }
        >
            {page}
        </AppLayout>
    );
};