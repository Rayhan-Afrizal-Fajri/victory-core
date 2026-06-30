import React, { useState } from 'react';
import JobTicketHeader from './components/JobTicketHeader';
import WorkflowTimeline from './components/WorkflowTimeline';
import WorkflowTabs from './components/WorkflowTabs';
import { JobTicket, Pesanan, ProductOption, Supplier } from './types';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import jobTickets from '@/routes/job-tickets';
import StatusBadge from './components/StatusBadge';
import { getJobStatusFromWorkflow, getWorkflowProgress } from '@/components/job-tickets/utils';

type Props = { 
    jobTicket: JobTicket; // Prop dirubah ke jobTicket dari controller
    suppliers: Supplier[];
    productOptions: ProductOption[] | null;
};

export default function Show({ jobTicket, suppliers, productOptions }: Props) {
    // State untuk Switcher / Tab pesanan mana yang sedang dilihat
    const [activeOrderIndex, setActiveOrderIndex] = useState<number>(0);
    const activePesanan: Pesanan | undefined = jobTicket?.orders?.[activeOrderIndex];

    return (
        <>
            <Head title={`Job Ticket — ${jobTicket?.no_job_ticket ?? 'Detail'}`} />

            {/* SWITCHER PESANAN MULTIPLE */}
            {/* {jobTicket?.orders && jobTicket.orders.length > 1 && (
                <div className="mb-6 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pilih Produk Pesanan:</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {jobTicket.orders.map((order, index) => (
                            <button
                                key={order.id}
                                onClick={() => setActiveOrderIndex(index)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center whitespace-nowrap ${
                                    activeOrderIndex === index
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <span className={`mr-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${activeOrderIndex === index ? 'bg-blue-500/50' : 'bg-slate-200'}`}>
                                    {index + 1}
                                </span>
                                {order.requested_product_name || order.product_name || `Produk #${index + 1}`}
                            </button>
                        ))}
                    </div>
                </div>
            )} */}

            {activePesanan ? (
                <>
                    {/* Mengirimkan Root JobTicket dan ActivePesanan */}
                    <WorkflowTimeline 
                        jobTicket={jobTicket} 
                        activePesanan={activePesanan} 
                    />
                    
                    <WorkflowTabs 
                        jobTicket={jobTicket} 
                        activePesanan={activePesanan} 
                        suppliers={suppliers} 
                        productOptions={productOptions} 
                    />
                </>
            ) : (
                <div className="p-8 text-center bg-white rounded-lg border border-slate-200 text-slate-500">
                    Tidak ada pesanan ditemukan dalam Job Ticket ini.
                </div>
            )}
        </>
    );
}

Show.layout = (page: React.ReactElement<Props>) => {
    const jobTicket = page.props?.jobTicket;

    const noJobTicket = jobTicket?.no_job_ticket || 'Detail Tiket';
    const status = jobTicket?.status || 'Order Entry';

    // Kalkulasi rata-rata progress untuk seluruh order
    let totalProgress = 0;
    let globalCurrentLabel = 'Menunggu Proses';

    if (jobTicket?.orders && jobTicket.orders.length > 0) {
        jobTicket.orders.forEach(order => {
            const wp = getWorkflowProgress(order.workflow_status);
            totalProgress += wp.percent;
        });
        totalProgress = Math.round(totalProgress / jobTicket.orders.length);

        // Ambil step dari pesanan pertama sbg representasi label
        const firstOrderWp = getWorkflowProgress(jobTicket.orders[0].workflow_status);
        globalCurrentLabel = firstOrderWp.currentLabel;
    }

    return (
        <AppLayout
            title={noJobTicket}
            description={`${jobTicket?.customer?.name ?? jobTicket?.customer?.company ?? 'Customer'} · ${jobTicket?.orders?.length ?? 0} Pesanan`}
            information="No. Job Ticket"
            breadcrumbs={[
                {
                    title: 'Job Tickets',
                    href: jobTickets.index(),
                },
                {
                    title: noJobTicket,
                    href: jobTicket ? jobTickets.show(jobTicket.id) : '#',
                },
            ]}
            actions={
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-sm text-gray-500">Deadline Global</div>
                        <div className="font-medium text-slate-800">
                            {jobTicket?.deadline ?? '—'}
                        </div>
                    </div>

                    <div className="text-right hidden sm:block">
                        <div className="text-sm text-gray-500">Avg. Progress</div>
                        <div className="w-40 overflow-hidden rounded-full bg-slate-100 h-3">
                            <div
                                className={`h-3 transition-all duration-500 ${
                                    totalProgress >= 100
                                        ? 'bg-green-600'
                                        : totalProgress >= 70
                                          ? 'bg-green-500'
                                          : totalProgress >= 40
                                            ? 'bg-amber-500'
                                            : 'bg-blue-500'
                                }`}
                                style={{ width: `${totalProgress}%` }}
                            />
                        </div>
                        <div className="mt-1 text-xs text-gray-600 font-medium">
                            {totalProgress}% · {globalCurrentLabel}
                        </div>
                    </div>

                    <div>
                        <div className="text-sm text-gray-500 mb-1">Status Tiket</div>
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