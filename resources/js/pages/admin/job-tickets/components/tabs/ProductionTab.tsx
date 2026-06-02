import React from 'react';

import type { JobTicket } from '../../types';
import WorkflowGate from '../WorkflowGate';

import ProductionRunBoard from '@/components/production-runs/production-run-board';

const ProductionTab: React.FC<{ job: JobTicket }> = ({ job }) => {
    const workflow = job.workflow_status;

    if (!workflow?.sample_approved) {
        return (
            <WorkflowGate reason="Sample belum disetujui. Production terkunci." />
        );
    }

    if (!workflow?.production_invoice_created) {
        return (
            <WorkflowGate reason="Invoice produksi belum dibuat." />
        );
    }

    if (!workflow?.production_dp_paid) {
        return (
            <WorkflowGate reason="DP produksi minimal 50% belum diverifikasi." />
        );
    }

    return (
        <div className="space-y-6">
            <ProductionRunBoard
                job={job}
                run={(job as any).production_run || null}
                runType="production"
            />
        </div>
    );
};

export default ProductionTab;