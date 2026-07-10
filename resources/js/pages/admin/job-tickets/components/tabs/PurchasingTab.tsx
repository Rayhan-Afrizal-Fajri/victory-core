import React, { useEffect, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';

import type { JobTicket, Pesanan, Supplier } from '../../types';
import WorkflowGate from '../WorkflowGate';

import DesignSpecsReferenceCard from '@/components/purchasings/design-specs-reference-card';
import PurchasingSummaryCard from '@/components/purchasings/purchasing-summary-card';
import PurchasingMaterialTable from '@/components/purchasings/purchasing-material-table';
import PurchasingFormDialog from '@/components/purchasings/purchasing-form-dialog';
import ReceivingDialog from '@/components/purchasings/receiving-dialog';
import GenerateBomPoCard from '@/components/purchasings/generate-bom-po-card';
import EditPoDialog from '@/components/purchasings/edit-po-dialog';

const PurchasingTab: React.FC<{ job: JobTicket, suppliers: Supplier[] }> = ({ job, suppliers }) => {
    useEffect(() => {
        const interval =  setInterval(() => {
            router.reload({
                only: ['job'],
                preserveScroll: true,
                preserveState: true,
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const [activeOrderIndex, setActiveOrderIndex] = useState<number>(0);
    const activerOrder: Pesanan | undefined = job?.orders?.[activeOrderIndex];
    const workflow = activerOrder?.workflow_status || {};

    const generateBomForm = useForm({
        sample_qty: activerOrder.sample_qty || 1,
    });

    const generatePurchasingFromBom = (e: React.FormEvent) => {
        e.preventDefault();

        generateBomForm.post(`/pesanan/${activerOrder.id}/purchasings/generate-from-bom`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Purchasing BOM/PO berhasil digenerate.'),
        });
    };

    const purchasings = activerOrder.purchasings || [];

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
        purchase_scope: 'sample_and_production',
        notes: '',
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
                purchase_scope: editingPurchasing.purchase_scope,
                notes: editingPurchasing.notes,
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

    // if (!verified) {
    //     return (
    //         <WorkflowGate reason="Invoice sample belum lunas. Purchasing terkunci." />
    //     );
    // }

    const openCreatePurchasing = () => {
        setPurchasingMode('create');
        setEditingPurchasing(null);

        purchasingForm.setData({
            supplier_id: null,
            item_bahan: '',
            qty_bahan: 10,
            satuan: '',
            harga_satuan: 0,
            tgl_pembelian: new Date().toISOString().slice(0, 10),
            purchase_scope: 'sample_and_production',
            notes: '',
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
                    useEffect(() => {
                        const interval =  setInterval(() => {
                            router.reload({
                                only: ['job'],
                                preserveScroll: true,
                                preserveState: true,
                            });
                        }, 3000);

                        return () => clearInterval(interval);
                    }, []);
                },
            });

            return;
        }

        purchasingForm.post(`/pesanan/${activerOrder.id}/purchasings`, {
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
                onSuccess: () => {
                    toast.success('Material ditandai ordered.');
                    useEffect(() => {
                        const interval =  setInterval(() => {
                            router.reload({
                                only: ['job'],
                                preserveScroll: true,
                                preserveState: true,
                            });
                        }, 3000);

                        return () => clearInterval(interval);
                    }, []);
                },
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
            {/* SWITCHER PESANAN */}
            {job.orders && job.orders.length > 1 && (
                <div className="mb-6 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pilih Produk Pesanan:</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {job.orders.map((order, index) => (
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
            )}

            <DesignSpecsReferenceCard job={activerOrder} />

            {purchasings.length === 0 || (workflow.sample_revision == true) && (
                <GenerateBomPoCard
                    job={activerOrder}
                    form={generateBomForm}
                    onSubmit={generatePurchasingFromBom}
                />
            )}
            {purchasings.length > 0 && (
                (
                    <>
                        <PurchasingSummaryCard purchasings={purchasings} job={activerOrder} />

                        <PurchasingMaterialTable
                            purchasings={purchasings}
                            job={activerOrder}
                            onCreate={openCreatePurchasing}
                            onEditManual={openEditPurchasing}
                            onEditPo={setEditingPo}
                            onDelete={deletePurchasing}
                            onMarkOrdered={markOrdered}
                            onReceive={openReceiveMaterial}
                            onDeleteReceiving={deleteReceiving}
                        />
                    </>
                )
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
                job={activerOrder}
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