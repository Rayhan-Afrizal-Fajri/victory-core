import React, { useEffect, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

import type { JobTicket, Supplier } from '../../types';
import WorkflowGate from '../WorkflowGate';

import DesignSpecsReferenceCard from '@/components/purchasings/design-specs-reference-card';
import PurchasingSummaryCard from '@/components/purchasings/purchasing-summary-card';
import PurchasingMaterialTable from '@/components/purchasings/purchasing-material-table';
import PurchasingFormDialog from '@/components/purchasings/purchasing-form-dialog';
import ReceivingDialog from '@/components/purchasings/receiving-dialog';
import GenerateBomPoCard from '@/components/purchasings/generate-bom-po-card';
import EditPoDialog from '@/components/purchasings/edit-po-dialog';

const PurchasingTab: React.FC<{ job: JobTicket, suppliers: Supplier[] }> = ({ job, suppliers }) => {
    const workflow = job.workflow_status;
    const verified = workflow?.sample_paid ?? false;

    const generateBomForm = useForm({
        sample_qty: 3,
    });

    const generatePurchasingFromBom = (e: React.FormEvent) => {
        e.preventDefault();

        generateBomForm.post(`/pesanan/${job.id}/purchasings/generate-from-bom`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Purchasing BOM/PO berhasil digenerate.'),
        });
    };

    const purchasings = job.purchasings || [];

    const [openPurchasingForm, setOpenPurchasingForm] = useState(false);
    const [purchasingMode, setPurchasingMode] = useState<'create' | 'edit'>('create');
    const [editingPurchasing, setEditingPurchasing] = useState<any | null>(null);

    const [openReceiving, setOpenReceiving] = useState(false);
    const [selectedPurchasing, setSelectedPurchasing] = useState<any | null>(null);

    const [editingPo, setEditingPo] = useState<any | null>(null);

    const poForm = useForm({
       supplier_id: null as number | null,
       stock_qty: 0,
       purchase_qty: 0,
       harga_satuan: 0,
       notes: '',
       tgl_pembelian: '', 
    });

    useEffect(() => {
        if (editingPo) {
            poForm.setData({
                supplier_id: editingPo.supplier_id || null,
                stock_qty: Number(editingPo.stock_qty || 0),
                purchase_qty: Number(
                    editingPo.purchase_qty ||
                    editingPo.ordered_qty ||
                    editingPo.qty_bahan ||
                    0
                ),
                harga_satuan: Number(editingPo.harga_satuan || 0),
                notes: editingPo.notes || '',
                tgl_pembelian: editingPo.tgl_pembelian || '',
            })
        }
    }, [editingPo?.id]);

    const purchasingForm = useForm({
        supplier_id: null as number | null,
        item_bahan: '',
        qty_bahan: 1,
        satuan: '',
        harga_satuan: 0,
        tgl_pembelian: new Date().toISOString().slice(0, 10),
    });

    const receivingForm = useForm({
        received_qty: 1,
        received_at: new Date().toISOString().slice(0, 10),
        notes: '',
    });

    useEffect(() => {
        if (editingPurchasing) {
            purchasingForm.setData({
                supplier_id: editingPurchasing.supplier_id || null,
                item_bahan: editingPurchasing.item || '',
                qty_bahan: Number(editingPurchasing.ordered_qty || 1),
                satuan: editingPurchasing.unit || '',
                harga_satuan: Number(editingPurchasing.harga_satuan || 0),
                tgl_pembelian:
                    editingPurchasing.tgl_pembelian ||
                    new Date().toISOString().slice(0, 10),
            });
        }
    }, [editingPurchasing?.id]);

    useEffect(() => {
        if (selectedPurchasing) {
            receivingForm.setData({
                received_qty: 1,
                received_at: new Date().toISOString().slice(0, 10),
                notes: '',
            });
        }
    }, [selectedPurchasing?.id]);

    if (!verified) {
        return (
            <WorkflowGate reason="Invoice sample belum lunas. Purchasing terkunci." />
        );
    }

    const openCreatePurchasing = () => {
        setPurchasingMode('create');
        setEditingPurchasing(null);

        purchasingForm.setData({
            supplier_id: null,
            item_bahan: '',
            qty_bahan: 1,
            satuan: '',
            harga_satuan: 0,
            tgl_pembelian: new Date().toISOString().slice(0, 10),
        });

        setOpenPurchasingForm(true);
    };

    const openEditPurchasing = (purchasing: any) => {
        setPurchasingMode('edit');
        setEditingPurchasing(purchasing);
        setOpenPurchasingForm(true);
    };

    const submitPurchasing = (e: React.FormEvent) => {
        e.preventDefault();

        if (purchasingMode === 'edit' && editingPurchasing) {
            purchasingForm.patch(`/purchasings/${editingPurchasing.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Material purchasing berhasil diperbarui.');
                    setOpenPurchasingForm(false);
                    setEditingPurchasing(null);
                    purchasingForm.reset();
                },
            });

            return;
        }

        purchasingForm.post(`/pesanan/${job.id}/purchasings`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Material purchasing berhasil dibuat.');
                setOpenPurchasingForm(false);
                purchasingForm.reset();
            },
        });
    };

    const updatePoItem = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingPo) {
            toast.error('PO item belum dipilih.');
            return;
        }

        poForm.patch(`/purchasings/${editingPo.id}/po`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('PO item berhasil diperbarui.');
                setEditingPo(null);
                poForm.reset();
            },
        });
    }

    const deletePurchasing = (purchasing: any) => {
        if (!confirm('Hapus material purchasing ini?')) return;

        router.delete(`/purchasings/${purchasing.id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Material purchasing berhasil dihapus.'),
        });
    };

    const markOrdered = (purchasing: any) => {
        router.patch(
            `/purchasings/${purchasing.id}/mark-ordered`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Material ditandai ordered.'),
            }
        );
    };

    const openReceiveMaterial = (purchasing: any) => {
        setSelectedPurchasing(purchasing);
        setOpenReceiving(true);
    };

    const submitReceiving = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPurchasing) {
            toast.error('Material belum dipilih.');
            return;
        }

        receivingForm.post(`/purchasings/${selectedPurchasing.id}/receivings`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Receiving material berhasil disimpan.');
                setOpenReceiving(false);
                setSelectedPurchasing(null);
                receivingForm.reset();
            },
        });
    };

    const deleteReceiving = (receiving: any) => {
        if (!confirm('Hapus riwayat receiving ini?')) return;

        router.delete(`/material-receivings/${receiving.id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Receiving material berhasil dihapus.'),
        });
    };

    return (
        <div className="space-y-6">
            <DesignSpecsReferenceCard job={job} />

            {purchasings.length === 0 ? (
                <GenerateBomPoCard
                    job={job}
                    form={generateBomForm}
                    onSubmit={generatePurchasingFromBom}
                />
            ) : (
                <>
                    <PurchasingSummaryCard purchasings={purchasings} />

                    <PurchasingMaterialTable
                        purchasings={purchasings}
                        onCreate={openCreatePurchasing}
                        onEditManual={openEditPurchasing}
                        onEditPo={setEditingPo}
                        onDelete={deletePurchasing}
                        onMarkOrdered={markOrdered}
                        onReceive={openReceiveMaterial}
                        onDeleteReceiving={deleteReceiving}
                    />
                </>
            )}

            <EditPoDialog
                open={Boolean(editingPo)}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingPo(null);
                        poForm.reset();
                    }
                }}
                purchasing={editingPo}
                form={poForm}
                suppliers={suppliers}
                onSubmit={updatePoItem}
            />

            <PurchasingFormDialog
                open={openPurchasingForm}
                suppliers={suppliers}
                onOpenChange={(open) => {
                    setOpenPurchasingForm(open);

                    if (!open) {
                        setEditingPurchasing(null);
                        purchasingForm.reset();
                    }
                }}
                form={purchasingForm}
                onSubmit={submitPurchasing}
                mode={purchasingMode}
            />

            <ReceivingDialog
                open={openReceiving}
                onOpenChange={(open) => {
                    setOpenReceiving(open);

                    if (!open) {
                        setSelectedPurchasing(null);
                        receivingForm.reset();
                    }
                }}
                purchasing={selectedPurchasing}
                form={receivingForm}
                onSubmit={submitReceiving}
            />
        </div>
    );
};

export default PurchasingTab;