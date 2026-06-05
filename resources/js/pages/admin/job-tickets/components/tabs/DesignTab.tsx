import { useForm, router } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';
import type { JobTicket, ProductOption, Supplier } from '../../types';
import SectionCard from '../SectionCard';
import FormImageUpload from '@/components/ui/form-image';
import { Button } from '@/components/ui/button';

import { store } from '@/routes/designs';
import { sync } from '@/routes/specifications';
import { Textarea } from '@/components/ui/textarea';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import OrderRequestSummaryCard from './OrderRequestSummaryCard';
import DesignSpecsPreview from './DesignSpecsPreview';
import MaterialSpecEditDialog from './MaterialSpecEditDialog';
import ManufacturingSpecEditDialog from './ManufacturingSpecEditDialog';
import QuotationSection from '@/components/designs/quotationSection';
import { useCan } from '@/hooks/use-can';
import DesignPreviewDialog from '@/components/designs/design-preview-dialog';
import CostingSummaryCard from '@/components/designs/costing-summary-card';


const emptySpec = {
    jenis_spesifikasi: '',
    value: '',
};

const DesignAndSpecsTab: React.FC<{
    job: JobTicket;
    products?: ProductOption[] | null;
    suppliers?: Supplier[]
}> = ({ job, products = [], suppliers = [] }) => {
    const can = useCan();

    const [previewOpen, setPreviewOpen] = useState(false);
    const [selectedPreview, setSelectedPreview] = useState<{
        url: string;
        title: string;
    } | null>(null);

    const openDesignPreview = (url: string, title = 'Preview Design') => {
        setSelectedPreview({url, title});
        setPreviewOpen(true);
    }

    const [editingMaterialSpec, setEditingMaterialSpec] = useState<any | null>(null);
    const [editingManufacturingSpec, setEditingManufacturingSpec] = useState<any | null>(null);
    const [materialSpecDialogOpen, setMaterialSpecDialogOpen] = useState(false);
    const [manufacturingSpecDialogOpen, setManufacturingSpecDialogOpen] = useState(false);

    const materialSpecForm = useForm({
        type: 'bahan',
        material_name_snapshot: '',
        material_id: null as number | null,
        color: '',
        usage: 0,
        unit: '',
        supplier_id: null as number | null,
        harga_ecer: 0,
        harga_roll: 0,
        price_type: 'ecer',
        roll_qty: 25,
    });

    const manufacturingSpecForm = useForm({
        work_name_snapshot: '',
        manufacturing_work_id: null as number | null,
        usage: 0,
        unit: '',
        usage_note: '',
        vendor_id: null as number | null,
        min_estimate: 0,
        max_estimate: 0,
        process_behavior: 'production_process',
    });

    const openCreateMaterialSpec = () => {
        setEditingMaterialSpec(null);

        materialSpecForm.setData({
            type: 'bahan',
            material_name_snapshot: '',
            material_id: null,
            color: '',
            usage: 0,
            unit: '',
            supplier_id: null,
            harga_ecer: 0,
            harga_roll: 0,
            price_type: 'ecer',
            roll_qty: 25,
        });

        setMaterialSpecDialogOpen(true);
    };

    const openEditMaterialSpec = (spec: any) => {
        setEditingMaterialSpec(spec);

        materialSpecForm.setData({
            type: spec.type || 'bahan',
            material_name_snapshot: spec.material_name_snapshot || '',
            material_id: spec.material_id || null,
            color: spec.color || '',
            usage: Number(spec.usage || 0),
            unit: spec.unit || '',
            supplier_id: spec.supplier_id || null,
            harga_ecer: Number(spec.harga_ecer || 0),
            harga_roll: Number(spec.harga_roll || 0),
            price_type: spec.price_type || 'ecer',
            roll_qty: Number(spec.roll_qty) || 25,
        });

        setMaterialSpecDialogOpen(true);
    };

    const openCreateManufacturingSpec = () => {
        setEditingManufacturingSpec(null);

        manufacturingSpecForm.setData({
            work_name_snapshot: '',
            manufacturing_work_id: null,
            usage: 0,
            unit: '',
            usage_note: '',
            vendor_id: null,
            min_estimate: 0,
            max_estimate: 0,
            process_behavior: 'production_process',
        });

        setManufacturingSpecDialogOpen(true);
    };

    const openEditManufacturingSpec = (spec: any) => {
        setEditingManufacturingSpec(spec);

        manufacturingSpecForm.setData({
            work_name_snapshot: spec.work_name_snapshot || '',
            manufacturing_work_id: spec.manufacturing_work_id || null,
            usage: Number(spec.usage || 0),
            unit: spec.unit || '',
            usage_note: spec.usage_note || '',
            vendor_id: spec.vendor_id || null,
            min_estimate: Number(spec.min_estimate || 0),
            max_estimate: Number(spec.max_estimate || 0),
            process_behavior: spec.process_behavior || 'production_process',
        });

        setManufacturingSpecDialogOpen(true);
    };

    const updateMaterialSpec = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingMaterialSpec) {
            toast.error('Spec belum dipilih.');
            return;
        }

        materialSpecForm.patch(`/design-material-specs/${editingMaterialSpec.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Spesifikasi material berhasil diperbarui.');
                setEditingMaterialSpec(null);
                materialSpecForm.reset();
            },
        });
    };

    const updateManufacturingSpec = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingManufacturingSpec) {
            toast.error('Spec belum dipilih.');
            return;
        }

        manufacturingSpecForm.patch(`/design-manufacturing-specs/${editingManufacturingSpec.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Spesifikasi manufaktur berhasil diperbarui.');
                setEditingManufacturingSpec(null);
                manufacturingSpecForm.reset();
            },
        });
    };

    const submitMaterialSpec = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingMaterialSpec) {
            materialSpecForm.patch(`/design-material-specs/${editingMaterialSpec.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Spesifikasi material berhasil diperbarui.');
                    setEditingMaterialSpec(null);
                    setMaterialSpecDialogOpen(false);
                    materialSpecForm.reset();
                },
            });

            return;
        }

        materialSpecForm.post(`/pesanan/${job.id}/material-specs`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Spesifikasi material berhasil ditambahkan.');
                setMaterialSpecDialogOpen(false);
                materialSpecForm.reset();
            },
        });
    };

    const submitManufacturingSpec = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingManufacturingSpec) {
            manufacturingSpecForm.patch(`/design-manufacturing-specs/${editingManufacturingSpec.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Spesifikasi manufaktur berhasil diperbarui.');
                    setEditingManufacturingSpec(null);
                    setManufacturingSpecDialogOpen(false);
                    manufacturingSpecForm.reset();
                },
            });

            return;
        }

        manufacturingSpecForm.post(`/pesanan/${job.id}/manufacturing-specs`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Spesifikasi manufaktur berhasil ditambahkan.');
                setManufacturingSpecDialogOpen(false);
                manufacturingSpecForm.reset();
            },
        });
    };

    const deleteMaterialSpec = (spec: any) => {
        if (!confirm(`Hapus material spec ${spec.material_name_snapshot}?`)) return;

        router.delete(`/design-material-specs/${spec.id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Spesifikasi material berhasil dihapus.'),
        });
    };

    const deleteManufacturingSpec = (spec: any) => {
        if (!confirm(`Hapus manufacturing spec ${spec.work_name_snapshot}?`)) return;

        router.delete(`/design-manufacturing-specs/${spec.id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Spesifikasi manufaktur berhasil dihapus.'),
        });
    };



    const specifications = (job as any).specs || [];

    const designs = (job as any).designs || [];

    const latestDesign = useMemo(() => {
        return designs.length > 0 ? designs[0] : null;
    }, [designs]);

    const needsRevisionUpload = latestDesign?.status === 'revision_needed';

    const specsForm = useForm({
        specs: specifications.length > 0 ? specifications : [emptySpec],
    });

    useEffect(() => {
        specsForm.setData(
            'specs',
            specifications.length > 0 ? specifications : [emptySpec],
        );
    }, [job]);

    const handleAddSpec = () => {
        specsForm.setData('specs', [
            ...specsForm.data.specs,
            { ...emptySpec },
        ]);
    };

    const handleRemoveSpec = (index: number) => {
        const newSpecs = specsForm.data.specs.filter(
            (_: any, i: number) => i !== index,
        );

        specsForm.setData(
            'specs',
            newSpecs.length > 0 ? newSpecs : [{ ...emptySpec }],
        );
    };

    const handleSpecChange = (
        index: number,
        field: 'jenis_spesifikasi' | 'value',
        val: string,
    ) => {
        const newSpecs = [...specsForm.data.specs];
        newSpecs[index][field] = val;
        specsForm.setData('specs', newSpecs);
    };

    const submitSpecs = (e: React.FormEvent) => {
        e.preventDefault();

        specsForm.post(sync(job.id).url, {
            preserveScroll: true,
            onSuccess: () => toast.success('Spesifikasi tersimpan!'),
        });
    };

    const designForm = useForm({
        file_desain: null as File | null,
        designer_revision_note: '',
    });

    const submitDesign = (e: React.FormEvent) => {
        e.preventDefault();

        designForm.post(store(job.id).url, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success('Desain berhasil diunggah!');
                designForm.reset();
            },
        });
    };

    const handleApproveDesign = (designId: number) => {
        router.patch(
            `/designs/${designId}/approve-design`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Desain disetujui.'),
            },
        );
    };

    const [revisionDesignId, setRevisionDesignId] = useState<number | null>(null);

    const revisionForm = useForm({
        revision_note: '',
    });

    const submitRevision = (designId: number) => {
        revisionForm.patch(`/designs/${designId}/request-revision`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Catatan revisi berhasil dikirim.');
                revisionForm.reset();
                setRevisionDesignId(null);
            },
        });
    };

    /**
     * Sync product
     */

    const selectedProduct = (job as any).product || null;
    const sizeBreakdowns = (job as any).size_breakdowns || [];
    const materialSpecs = (job as any).material_specs || [];
    const manufacturingSpecs = (job as any).manufacturing_specs || [];

    const syncArticleForm = useForm({
        product_id: selectedProduct?.id ? String(selectedProduct.id) : '',
    });

    useEffect(() => {
        syncArticleForm.setData(
            'product_id',
            selectedProduct?.id ? String(selectedProduct.id) : ''
        );
    }, [selectedProduct?.id]);

    const submitSyncArticle = (e: React.FormEvent) => {
        e.preventDefault();

        if (!syncArticleForm.data.product_id) {
            toast.error('Pilih artikel terlebih dahulu.');
            return;
        }

        const hasExistingSpecs =
            materialSpecs.length > 0 || manufacturingSpecs.length > 0;

        if (hasExistingSpecs) {
            toast.warning(`Sync ulang artikel akan mengganti spesifikasi bahan, aksesoris, dan manufaktur yang sudah ada. Lanjutkan?`, {
                action: {
                    label: 'Ya, Sync Ulang',
                    onClick: () => {
                        syncArticleForm.post(`/pesanan/${job.id}/sync-article`, {
                            preserveScroll: true,
                            onSuccess: () => toast.success('Artikel berhasil disinkronkan.'),
                        });
                    },
                },
            });
        } else {
            syncArticleForm.post(`/pesanan/${job.id}/sync-article`, {
                preserveScroll: true,
                onSuccess: () => toast.success('Artikel berhasil disinkronkan.'),
            });
        }
    };


    /**
     * Formula Costing
     */

    function getRecommendedPrice(cost: number, margin: number) {
        if (!cost || cost <= 0) return 0;

        return cost / (1 - margin);
    }

    const orderQty = Number((job as any).quantity || (job as any).q || 0);

    const costingSummary = useMemo(() => {
        const materialCostPerPcs = materialSpecs.reduce((total: number, item: any) => {
            return total + Number(item.cost_per_pcs || 0);
        }, 0);

        const manufacturingCostPerPcs = manufacturingSpecs.reduce((total: number, item: any) => {
            return total + Number(item.cost_per_pcs || 0);
        }, 0);

        const hppPerPcs = materialCostPerPcs + manufacturingCostPerPcs;

        return {
            materialCostPerPcs,
            manufacturingCostPerPcs,
            hppPerPcs,
            totalHpp: hppPerPcs * orderQty,
            recommendations: {
                25: getRecommendedPrice(hppPerPcs, 0.25),
                30: getRecommendedPrice(hppPerPcs, 0.30),
                35: getRecommendedPrice(hppPerPcs, 0.35),
                40: getRecommendedPrice(hppPerPcs, 0.40),
            },
        };
    }, [materialSpecs, manufacturingSpecs, orderQty]);

    const ownerPriceForm = useForm({
        harga_jual_per_pcs: Number((job as any).price_per_piece || 0),
        estimasi_hpp_per_pcs: 0,
    });

    useEffect(() => {
        ownerPriceForm.setData({
            harga_jual_per_pcs: Number((job as any).price_per_piece || 0),
            estimasi_hpp_per_pcs: costingSummary.hppPerPcs,
        });
    }, [(job as any).price_per_piece, costingSummary.hppPerPcs]);

    const submitOwnerPrice = (e: React.FormEvent) => {
        e.preventDefault();

        ownerPriceForm.patch(`/pesanan/${job.id}/owner-selling-price`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Harga jual final berhasil disimpan.'),
        });
    };    

    return (
        <div className="space-y-8">
            <OrderRequestSummaryCard
                job={job}
                sizeBreakdowns={sizeBreakdowns}
            />

            <SectionCard title="Manajemen Desain & Revisi">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {can('design.upload') && (
                        <form onSubmit={submitDesign} className="space-y-4">
                            <FormImageUpload
                                label={
                                    needsRevisionUpload
                                        ? 'Upload Desain Revisi'
                                        : 'Upload Desain'
                                }
                                accept='image/*,.pdf'
                                preview=''
                                subtitle='PNG, JPG, WEBP, PDF (MAX.10MB)'
                                onChange={(file) =>
                                    designForm.setData('file_desain', file)
                                }
                                hint="Upload file desain untuk direview owner."
                                error={designForm.errors.file_desain}
                            />

                            {needsRevisionUpload && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">
                                        Catatan Perbaikan Designer
                                    </label>

                                    <Textarea
                                        className="w-full rounded-md border-slate-300 text-sm shadow-sm"
                                        rows={3}
                                        value={
                                            designForm.data.designer_revision_note
                                        }
                                        onChange={(e) =>
                                            designForm.setData(
                                                'designer_revision_note',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Warna logo sudah disesuaikan, ukuran tulisan diperbesar, dan posisi desain digeser ke tengah."
                                    />

                                    {designForm.errors.designer_revision_note && (
                                        <p className="text-xs text-red-500">
                                            {
                                                designForm.errors
                                                    .designer_revision_note
                                            }
                                        </p>
                                    )}
                                </div>
                            )}

                            {needsRevisionUpload &&
                                latestDesign?.revision_note && (
                                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                        <p className="font-semibold">
                                            Catatan revisi:
                                        </p>
                                        <p>{latestDesign.revision_note}</p>
                                    </div>
                                )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={
                                    (designForm.processing || !designForm.data.file_desain) ||
                                    job?.workflow_status?.design_approved
                                }
                            >
                                {designForm.processing
                                    ? 'Mengunggah...'
                                    : needsRevisionUpload
                                        ? 'Upload Revisi Desain'
                                        : 'Upload Desain'}
                            </Button>
                        </form>
                    )}

                    <div className="space-y-4 rounded-lg border bg-slate-50 p-4">
                        <h4 className="text-sm font-semibold text-slate-700">
                            Riwayat Desain
                        </h4>

                        <div className="max-h-100 space-y-3 overflow-y-auto pr-2">
                            {designs.length === 0 ? (
                                <p className="text-xs italic text-slate-500">
                                    Belum ada desain yang diunggah.
                                </p>
                            ) : (
                                designs.map((d: any) => (
                                    <div
                                        key={d.id}
                                        className={`rounded border p-3 text-sm ${
                                            d.status === 'approved'
                                                ? 'border-emerald-200 bg-emerald-50'
                                                : d.status ===
                                                    'revision_needed'
                                                    ? 'border-amber-200 bg-amber-50'
                                                    : 'bg-white'
                                        }`}
                                    >
                                        <div className="mb-2 flex items-start justify-between">
                                            <span className="text-xs font-medium text-slate-900">
                                                {new Date(
                                                    d.uploaded_at ||
                                                        d.created_at,
                                                ).toLocaleDateString('id-ID')}
                                            </span>

                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                    d.status === 'approved'
                                                        ? 'bg-emerald-200 text-emerald-800'
                                                        : d.status ===
                                                            'revision_needed'
                                                            ? 'bg-amber-200 text-amber-800'
                                                            : 'bg-slate-200 text-slate-700'
                                                }`}
                                            >
                                                {d.status.replace('_', ' ')}
                                            </span>
                                        </div>

                                        {d.file_path && (
                                            <button
                                                type='button'
                                                onClick={() => 
                                                    openDesignPreview(
                                                        `/storage/${d.file_path}`,
                                                        `Design #${d.id}`,
                                                    )
                                                }
                                                className="block"
                                            >
                                                <img
                                                    src={`/storage/${d.file_path}`}
                                                    alt="Thumbnail desain"
                                                    className="mb-2 h-72 w-72 rounded border object-cover"
                                                />
                                            </button>
                                        )}

                                        {d.revision_note && (
                                            <div className="mb-2 rounded border border-red-100 bg-red-50 p-2 text-xs text-red-700">
                                                <p className="font-semibold">
                                                    Catatan:
                                                </p>
                                                <p>{d.revision_note}</p>
                                            </div>
                                        )}

                                        {d.designer_revision_note && (
                                            <div className="mb-2 rounded border border-blue-100 bg-blue-50 p-2 text-xs text-blue-700">
                                                <p className="font-semibold">
                                                    Catatan designer:
                                                </p>
                                                <p>{d.designer_revision_note}</p>
                                            </div>
                                        )}

                                        {['waiting_approval', 'approved'].includes(d.status) && can('design.approve') && (
                                            <div className="space-y-3">
                                                <div className="flex gap-2">
                                                    {d.status === 'waiting_approval' && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50"
                                                            onClick={() => handleApproveDesign(d.id)}
                                                        >
                                                            <CheckCircle className="mr-1 size-3" />
                                                            Setujui
                                                        </Button>
                                                    )}

                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 border-red-200 text-xs text-red-700 hover:bg-red-50"
                                                        onClick={() => setRevisionDesignId(d.id)}
                                                    >
                                                        <XCircle className="mr-1 size-3" />
                                                        {d.status === 'approved' ? 'Revisi Lagi' : 'Revisi'}
                                                    </Button>
                                                </div>

                                                {revisionDesignId === d.id && (
                                                    <div className="space-y-2">
                                                        {d.status === 'approved' && (
                                                            <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                                                                Desain ini sudah disetujui. Jika revisi dikirim, approval akan dibatalkan dan designer harus upload desain revisi baru.
                                                            </div>
                                                        )}

                                                        <Textarea
                                                            className="w-full rounded-md border-slate-300 text-xs shadow-sm"
                                                            rows={3}
                                                            value={revisionForm.data.revision_note}
                                                            onChange={(e) =>
                                                                revisionForm.setData(
                                                                    'revision_note',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="Tulis catatan revisi..."
                                                        />

                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setRevisionDesignId(null)}
                                                            >
                                                                Batal
                                                            </Button>

                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                disabled={revisionForm.processing}
                                                                onClick={() => submitRevision(d.id)}
                                                            >
                                                                Kirim Revisi
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        <DesignPreviewDialog
                            open={previewOpen}
                            onOpenChange={setPreviewOpen}
                            fileUrl={selectedPreview?.url || null}
                            title={selectedPreview?.title || 'Preview Design'}
                        />
                    </div>
                </div>
            </SectionCard>

            {can('design.sync_article') && (
                <SectionCard title="Sync Artikel Master">
                    <form onSubmit={submitSyncArticle} method='POST' className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                            <Select
                                value={syncArticleForm.data.product_id}
                                onValueChange={(value) =>
                                    syncArticleForm.setData('product_id', value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pilih artikel master" />
                                </SelectTrigger>

                                <SelectContent>
                                    {products?.map((product) => (
                                        <SelectItem
                                            key={product.id}
                                            value={String(product.id)}
                                        >
                                            {product.name}
                                            {product.category ? ` — ${product.category}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button type="submit" disabled={syncArticleForm.processing || job?.workflow_status?.quotation_created}>
                                {selectedProduct ? 'Sync Ulang Artikel' : 'Sync Artikel'}
                            </Button>
                        </div>

                        {selectedProduct && (
                            <div className="rounded-xl border bg-emerald-50 p-3 text-sm text-emerald-800">
                                Artikel aktif: <strong>{selectedProduct.name}</strong>
                            </div>
                        )}

                        {syncArticleForm.errors.product_id && (
                            <p className="text-xs text-red-500">
                                {syncArticleForm.errors.product_id}
                            </p>
                        )}
                    </form>
                </SectionCard>
            )}

            {materialSpecs.length === 0 && manufacturingSpecs.length === 0 ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                    Belum ada spesifikasi bahan atau manufaktur. Sync artikel master untuk mengisi data spesifikasi, atau tambahkan spesifikasi secara manual.
                </div>
            ): (
                
                can('design.manage_specs') && (
                    <>
                        <DesignSpecsPreview
                            job={job}
                            materialSpecs={materialSpecs}
                            manufacturingSpecs={manufacturingSpecs}
                            onEditMaterial={openEditMaterialSpec}
                            onEditManufacturing={openEditManufacturingSpec}
                            onCreateMaterial={openCreateMaterialSpec}
                            onCreateManufacturing={openCreateManufacturingSpec}
                            onDeleteMaterial={deleteMaterialSpec}
                            onDeleteManufacturing={deleteManufacturingSpec}
                        />
                    </>
                )
                
            )}

            <MaterialSpecEditDialog
                open={materialSpecDialogOpen}
                onOpenChange={(open) => {
                    setMaterialSpecDialogOpen(open);

                    if (!open) {
                        setEditingMaterialSpec(null);
                        materialSpecForm.reset();
                    }
                }}
                spec={editingMaterialSpec}
                form={materialSpecForm}
                suppliers={suppliers}
                onSubmit={submitMaterialSpec}
                mode={editingMaterialSpec ? 'edit' : 'create'}
            />

            <ManufacturingSpecEditDialog
                open={manufacturingSpecDialogOpen}
                onOpenChange={(open) => {
                    setManufacturingSpecDialogOpen(open);

                    if (!open) {
                        setEditingManufacturingSpec(null);
                        manufacturingSpecForm.reset();
                    }
                }}
                spec={editingManufacturingSpec}
                form={manufacturingSpecForm}
                suppliers={suppliers}
                onSubmit={submitManufacturingSpec}
                mode={editingManufacturingSpec ? 'edit' : 'create'}
                enableProcessBehavior={true}
            />
        </div>
    );
};


export default DesignAndSpecsTab;