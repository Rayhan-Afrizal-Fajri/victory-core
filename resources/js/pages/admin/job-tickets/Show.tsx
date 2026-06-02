import React from 'react';
import JobTicketHeader from './components/JobTicketHeader';
import WorkflowTimeline from './components/WorkflowTimeline';
import WorkflowTabs from './components/WorkflowTabs';
import { JobTicket, ProductOption, Supplier } from './types';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import jobTickets from '@/routes/job-tickets';
import StatusBadge from './components/StatusBadge';
import { getJobStatusFromWorkflow, getWorkflowProgress } from '@/components/job-tickets/utils';

type Props = { 
    pesanan?: JobTicket;
    suppliers: Supplier[];
    productOptions: ProductOption[] | null;
};

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
    { id: 1, item: 'Kain Katun', supplier: null, ordered_qty: 100, received_qty: 20 },
  ],
  productionProgress: { percent: 20, phase: 'Cutting', checklist: ['Potong', 'Sew'] },
  qc: { reject_count: 0 },
  packing: {},
  delivery: {},
  activity_logs: [{ id: 1, actor: 'Andi', role: 'CS', action: 'Buat job', note: 'Order masuk', created_at: '2026-05-10' }],
};

export default function Show({ pesanan, suppliers, productOptions }: Props) {
  const jobTicket = pesanan ?? dummyJobTicket;

  return (
    <>
        <Head title={`Job Ticket — ${jobTicket.order_number}`} />

        <WorkflowTimeline job={jobTicket} />
        <WorkflowTabs job={jobTicket} suppliers={suppliers} productOptions={productOptions} />

    </>
  );
}


// Perbarui fungsi Show.layout di bagian paling bawah file Show.tsx Anda menjadi seperti ini:

Show.layout = (page: React.ReactElement<Props>) => {
    const pesanan = page.props?.pesanan;

    const noJobTicket =
        pesanan?.order_number || 'Detail Tiket';

    const workflow = (pesanan as any)?.workflow_status || null;

    const workflowProgress = getWorkflowProgress(workflow);

    const progress = workflowProgress.percent;

    const priority =
        pesanan?.productionProgress?.prioritas ??
        (pesanan as any)?.priority ??
        'Normal';

    const status = getJobStatusFromWorkflow(workflow);

    return (
        <AppLayout
            title={noJobTicket}
            description={`${pesanan?.customer?.company ?? 'Customer'} · ${pesanan?.product_name ?? 'Produk'}`}
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
                        <div className="font-medium">
                            {pesanan?.deadline ?? '—'}
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-sm text-gray-500">
                            Progress
                        </div>

                        <div className="w-40 overflow-hidden rounded-full bg-gray-100 h-3">
                            <div
                                className={`h-3 transition-all duration-500 ${
                                    progress >= 100
                                        ? 'bg-green-600'
                                        : progress >= 70
                                          ? 'bg-green-500'
                                          : progress >= 40
                                            ? 'bg-amber-500'
                                            : 'bg-blue-500'
                                }`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <div className="mt-1 text-xs text-gray-600">
                            {progress}% · {workflowProgress.currentLabel}
                        </div>
                    </div>

                    <div>
                        <div className="text-sm text-gray-500">Prioritas</div>
                        <StatusBadge
                            label={priority ?? 'Normal'}
                            variant={
                                priority === 'High' || priority === 'Urgent'
                                    ? 'warning'
                                    : 'default'
                            }
                        />
                    </div>

                    <div>
                        <div className="text-sm text-gray-500">Status</div>
                        <StatusBadge
                            label={status}
                            variant={status === 'Done' ? 'success' : 'info'}
                        />
                    </div>
                </div>
            }
        >
            {page}
        </AppLayout>
    );
};