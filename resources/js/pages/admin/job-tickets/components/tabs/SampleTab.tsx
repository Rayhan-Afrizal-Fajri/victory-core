import React from 'react';

import type { JobTicket } from '../../types';
import WorkflowGate from '../WorkflowGate';

import ProductionRunBoard from '@/components/production-runs/production-run-board';

const SampleTab: React.FC<{ job: JobTicket }> = ({ job }) => {
    const workflow = job.workflow_status;

    if (!workflow?.materials_received) {
        return (
            <WorkflowGate reason="Material belum diterima semua. Sample production terkunci." />
        );
    }

    return (
        <div className="space-y-6">
            <ProductionRunBoard
                job={job}
                run={(job as any).sample_run || null}
                runType="sample"
            />
        </div>
    );
};

export default SampleTab;