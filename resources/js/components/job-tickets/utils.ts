import type { WorkflowStatus } from '../../pages/admin/job-tickets/types';

const workflowProgressSteps = [
    {
        key: 'order_entry',
        label: 'Order Entry',
        weight: 5,
        isDone: (w: WorkflowStatus) => Boolean(w.pesanan_id),
    },
    {
        key: 'design',
        label: 'Design',
        weight: 10,
        isDone: (w: WorkflowStatus) => Boolean(w.design_approved),
    },
    {
        key: 'quotation',
        label: 'Quotation',
        weight: 10,
        isDone: (w: WorkflowStatus) => Boolean(w.quotation_approved),
    },
    {
        key: 'sample_payment',
        label: 'Sample Payment',
        weight: 7,
        isDone: (w: WorkflowStatus) => Boolean(w.sample_paid),
    },
    {
        key: 'purchasing',
        label: 'Purchasing',
        weight: 10,
        isDone: (w: WorkflowStatus) => Boolean(w.materials_purchased),
    },
    {
        key: 'materials_received',
        label: 'Materials Received',
        weight: 10,
        isDone: (w: WorkflowStatus) => Boolean(w.materials_received),
    },
    {
        key: 'sample_created',
        label: 'Sample Created',
        weight: 8,
        isDone: (w: WorkflowStatus) => Boolean(w.sample_created),
    },
    {
        key: 'sample_delivered',
        label: 'Sample Delivered',
        weight: 5,
        isDone: (w: WorkflowStatus) => Boolean(w.sample_delivered),
    },
    {
        key: 'sample_approved',
        label: 'Sample Approved',
        weight: 5,
        isDone: (w: WorkflowStatus) => Boolean(w.sample_approved),
    },
    {
        key: 'production_payment',
        label: 'Production Payment',
        weight: 7,
        isDone: (w: WorkflowStatus) => Boolean(w.production_dp_paid),
    },
    {
        key: 'production_started',
        label: 'Production Started',
        weight: 5,
        isDone: (w: WorkflowStatus) => Boolean(w.production_started),
    },
    {
        key: 'production_completed',
        label: 'Production Completed',
        weight: 8,
        isDone: (w: WorkflowStatus) => Boolean(w.production_completed),
    },
    {
        key: 'qc_completed',
        label: 'QC Completed',
        weight: 5,
        isDone: (w: WorkflowStatus) => Boolean(w.qc_completed),
    },
    {
        key: 'packing_completed',
        label: 'Packing',
        weight: 5,
        isDone: (w: WorkflowStatus) => Boolean(w.packing_completed),
    },
    {
        key: 'final_payment_paid',
        label: 'Final Payment',
        weight: 5,
        isDone: (w: WorkflowStatus) => Boolean(w.final_payment_paid),
    },
    {
        key: 'delivered',
        label: 'Delivered',
        weight: 3,
        isDone: (w: WorkflowStatus) => Boolean(w.delivered),
    },
    {
        key: 'completed',
        label: 'Done',
        weight: 2,
        isDone: (w: WorkflowStatus) => Boolean(w.completed),
    },
];

export function getWorkflowProgress(workflow?: WorkflowStatus | null) {
    if (!workflow) {
        return {
            percent: 0,
            currentLabel: 'Not Started',
            completedWeight: 0,
            totalWeight: workflowProgressSteps.reduce((sum, step) => sum + step.weight, 0),
        };
    }

    const totalWeight = workflowProgressSteps.reduce((sum, step) => sum + step.weight, 0);

    const completedWeight = workflowProgressSteps.reduce((sum, step) => {
        return sum + (step.isDone(workflow) ? step.weight : 0);
    }, 0);

    const percent = Math.min(
        100,
        Math.round((completedWeight / totalWeight) * 100)
    );

    const currentStep =
        workflowProgressSteps.find((step) => !step.isDone(workflow)) ||
        workflowProgressSteps[workflowProgressSteps.length - 1];

    return {
        percent,
        currentLabel: percent >= 100 ? 'Done' : currentStep.label,
        completedWeight,
        totalWeight,
    };
}

export function getJobStatusFromWorkflow(workflow?: WorkflowStatus | null) {
    if (!workflow) return 'Aktif';

    if (workflow.completed) return 'Done';
    if (workflow.delivered) return 'Delivered';
    if (workflow.final_payment_paid) return 'Final Payment Paid';
    if (workflow.packing_completed) return 'Packing Completed';
    if (workflow.production_completed) return 'Production Completed';
    if (workflow.production_started) return 'Production';
    if (workflow.production_dp_paid) return 'Production Payment';
    if (workflow.sample_approved) return 'Sample Approved';
    if (workflow.sample_delivered) return 'Sample Delivered';
    if (workflow.sample_created) return 'Sample Created';
    if (workflow.materials_received) return 'Materials Received';
    if (workflow.materials_purchased) return 'Purchasing';
    if (workflow.sample_paid) return 'Sample Payment';
    if (workflow.quotation_approved) return 'Quotation Approved';
    if (workflow.design_approved) return 'Design Approved';

    return 'Aktif';
}