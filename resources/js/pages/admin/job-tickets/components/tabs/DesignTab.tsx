import { useForm, router } from '@inertiajs/react';
import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { CheckCircle, Download, Trash2, XCircle } from 'lucide-react';
import type { DefaultSizeBreakdown, JobTicket, Pesanan, ProductOption, Supplier } from '../../types';
import SectionCard from '../SectionCard';
import FormImageUpload from '@/components/ui/form-image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from '@/components/ui/select';
import Select from 'react-select';

import OrderRequestSummaryCard from './OrderRequestSummaryCard';
import DesignSpecsPreview from './DesignSpecsPreview';
import MaterialSpecEditDialog from './MaterialSpecEditDialog';
import ManufacturingSpecEditDialog from './ManufacturingSpecEditDialog';
import DesignPreviewDialog from '@/components/designs/design-preview-dialog';
import CostingSummaryCard from '@/components/designs/costing-summary-card';
import { useCan } from '@/hooks/use-can';

function isPdf(path: string) {
    return path.toLowerCase().endsWith('.pdf');
}

const DesignAndSpecsTab: React.FC<{
    jobTicket: JobTicket;
    products?: ProductOption[] | null;
    suppliers?: Supplier[];
    colors?: DefaultSizeBreakdown[];
    units?: DefaultSizeBreakdown[];
}> = ({ jobTicket, products = [], suppliers = [], colors = [], units = [] }) => {
    const can = useCan();

    // ==========================================
    // 1. STATE SWITCHER PESANAN (MULTIPLE ORDER)
    // ==========================================
    const [activeOrderIndex, setActiveOrderIndex] = useState<number>(0);
    const activeOrder: Pesanan | undefined = jobTicket?.orders?.[activeOrderIndex];

    // ==========================================
    // 2. STATES
    // ==========================================
    const [previewOpen, setPreviewOpen] = useState(false);
    const [selectedPreview, setSelectedPreview] = useState<{
        url: string;
        title: string;
    } | null>(null);

    const [materialSpecDialogOpen, setMaterialSpecDialogOpen] = useState(false);
    const [editingMaterialSpec, setEditingMaterialSpec] = useState<any | null>(null);
    
    const [manufacturingSpecDialogOpen, setManufacturingSpecDialogOpen] = useState(false);
    const [editingManufacturingSpec, setEditingManufacturingSpec] = useState<any | null>(null);

    const [revisionDesignId, setRevisionDesignId] = useState<number | null>(null);

    const productOptions = products?.map((p)=>({
        value: p.id.toString(),
        label: p.name,
    }))

    const supplierOptions = suppliers?.map((s) => ({
        value: s.id,
        label: `${s.nama_perusahaan || s.nama || 'Supplier'}${s.kategori ? ` - ${s.kategori}` : ''}`
    }))

    // ==========================================
    // 3. FORMS
    // ==========================================
    const designForm = useForm({
        file_desain: null as File | null,
        designer_revision_note: '',
    });

    const revisionForm = useForm({
        revision_note: '',
    });

    const syncArticleForm = useForm({
        product_id: activeOrder?.product?.id?.toString() || '',
    });

    const ownerPriceForm = useForm({
        harga_jual_per_pcs: activeOrder?.price_per_piece || 0,
        estimasi_hpp_per_pcs: activeOrder?.estimated_hpp_per_piece || 0,
    });

    const materialSpecForm = useForm({
        type: 'bahan',
        material_name_snapshot: '',
        color: '',
        usage: '',
        unit: 'kg',
        supplier_id: '',
        harga_ecer: '',
        harga_roll: '',
        price_type: 'ecer',
        roll_qty: '',
    });

    const manufacturingSpecForm = useForm({
        work_name_snapshot: '',
        usage: 1,
        unit: 'pcs',
        usage_note: '',
        vendor_id: '',
        min_estimate: '',
        max_estimate: '',
        process_behavior: 'production_process',
    });

    // RESET FORMS & STATES SAAT SWITCHER PESANAN BERUBAH
    useEffect(() => {
        if (activeOrder) {
            syncArticleForm.setData('product_id', activeOrder.product?.id?.toString() || '');
            ownerPriceForm.setData({
                harga_jual_per_pcs: activeOrder.price_per_piece || 0,
                estimasi_hpp_per_pcs: activeOrder.estimated_hpp_per_piece || 0,
            });
            designForm.reset();
            revisionForm.reset();
            setRevisionDesignId(null);
        }
    }, [activeOrder?.id]);

    // ==========================================
    // 4. COMPUTED DATA
    // ==========================================
    if (!activeOrder) return <div className="p-4 text-center text-slate-500">Tidak ada pesanan.</div>;

    const designs = activeOrder.designs || [];
    const workflow = activeOrder.workflow_status || {};
    
    const latestDesign = useMemo(() => {
        return designs.length > 0 ? designs[0] : null;
    }, [designs]);

    const needsRevisionUpload = latestDesign?.status === 'revision_needed';

    // ==========================================
    // 5. HANDLERS (DESAIN & REVISI)
    // ==========================================
    const openDesignPreview = (url: string, title = 'Preview Design') => {
        setSelectedPreview({ url, title });
        setPreviewOpen(true);
    };

    const submitDesign = (e: React.FormEvent) => {
        e.preventDefault();
        designForm.post(route('designs.store', activeOrder.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success(needsRevisionUpload ? 'Desain revisi diunggah!' : 'Desain berhasil diunggah!');
                designForm.reset();
            },
        });
    };

    const handleDeleteDesign = (designId: number) => {
        toast.warning('Hapus desain ini?', {
            description:
                'Desain yang masih menunggu approval beserta file yang diunggah akan dihapus permanen.',
            action: {
                label: 'Ya, Hapus',
                onClick: () => {
                    router.delete(
                        route('design.destroy', designId),
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                toast.success('Desain berhasil dihapus.');
                            },
                            onError: () => {
                                toast.error('Gagal menghapus desain.');
                            },
                        }
                    );
                },
            },
        });
    };

    const handleApproveDesign = (designId: number) => {
        router.patch(`/designs/${designId}/approve-design`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Desain disetujui.'),
        });
    };

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

    // ==========================================
    // 6. HANDLERS (SPESIFIKASI & COSTING)
    // ==========================================
    const submitMaterialSpec = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingMaterialSpec) {
            materialSpecForm.patch(route('design-material-specs.update', editingMaterialSpec.id), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Material spec diperbarui.');
                    setMaterialSpecDialogOpen(false);
                    setEditingMaterialSpec(null);
                },
            });
        } else {
            materialSpecForm.post(route('pesanan.material-specs.store', activeOrder.id), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Material spec ditambahkan.');
                    setMaterialSpecDialogOpen(false);
                },
            });
        }
    };

    const submitManufacturingSpec = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingManufacturingSpec) {
            manufacturingSpecForm.patch(route('design-manufacturing-specs.update', editingManufacturingSpec.id), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Manufaktur spec diperbarui.');
                    setManufacturingSpecDialogOpen(false);
                    setEditingManufacturingSpec(null);
                },
            });
        } else {
            manufacturingSpecForm.post(route('pesanan.manufacturing-specs.store', activeOrder.id), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Manufaktur spec ditambahkan.');
                    setManufacturingSpecDialogOpen(false);
                },
            });
        }
    };

    const updateOwnerSellingPrice = (e: React.FormEvent) => {
        e.preventDefault();
        ownerPriceForm.patch(route('designs.owner-selling-price', activeOrder.id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Harga jual final berhasil disimpan.'),
        });
    };

    const submitSyncArticle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeOrder.workflow_status?.design_approved) {
            toast.error('Desain pesanan ini belum diapprove.');
            return;
        }

        const hasExistingSpecs = (activeOrder.material_specs && activeOrder.material_specs.length > 0) || 
                                 (activeOrder.manufacturing_specs && activeOrder.manufacturing_specs.length > 0);

        if (hasExistingSpecs) {
            toast.warning(`Sync ulang artikel akan mengganti spesifikasi bahan, aksesoris, dan manufaktur yang sudah ada. Lanjutkan?`, {
                action: {
                    label: 'Ya, Sync Ulang',
                    onClick: () => {
                        syncArticleForm.post(route('designs.sync-article', activeOrder.id), {
                            preserveScroll: true,
                            onSuccess: () => toast.success('Artikel berhasil disinkronkan.'),
                        });
                    },
                },
            });
        } else {
            syncArticleForm.post(route('designs.sync-article', activeOrder.id), {
                preserveScroll: true,
                onSuccess: () => toast.success('Artikel berhasil disinkronkan.'),
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* SWITCHER PESANAN */}
            {jobTicket.orders && jobTicket.orders.length > 1 && (
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
            )}

            <OrderRequestSummaryCard activeOrder={activeOrder} />

            <div className="space-y-6">
                {/* BAGIAN UPLOAD & RIWAYAT DESAIN */}
                <SectionCard title="Desain Mockup & Artwork">
                    <div className='grid grid-cols-1 gap-8 md:grid-cols-2'>
                        
                        {/* Form Upload */}
                        {!workflow.design_approved && can('designs.upload') ? (
                            <form onSubmit={submitDesign} className="space-y-4">
                                <FormImageUpload
                                    label={needsRevisionUpload ? 'Upload Desain Revisi' : 'Upload Desain'}
                                    accept='image/*,.pdf'
                                    preview=''
                                    subtitle='PNG, JPG, WEBP, PDF (MAX.10MB)'
                                    onChange={(file) => designForm.setData('file_desain', file)}
                                    hint="Upload file desain untuk direview owner."
                                    error={designForm.errors.file_desain}
                                    disabled={!can('designs.upload')}
                                />

                                {needsRevisionUpload && (
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Catatan Perbaikan Designer</label>
                                        <Textarea
                                            className="w-full rounded-md border-slate-300 text-sm shadow-sm"
                                            rows={3}
                                            value={designForm.data.designer_revision_note}
                                            onChange={(e) => designForm.setData('designer_revision_note', e.target.value)}
                                            placeholder="Contoh: Warna logo sudah disesuaikan..."
                                        />
                                        {designForm.errors.designer_revision_note && (
                                            <p className="text-xs text-red-500">{designForm.errors.designer_revision_note}</p>
                                        )}
                                    </div>
                                )}

                                {needsRevisionUpload && latestDesign?.revision_note && (
                                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                        <p className="font-semibold">Catatan revisi dari Owner:</p>
                                        <p>{latestDesign.revision_note}</p>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={designForm.processing || !designForm.data.file_desain || workflow.design_approved}
                                >
                                    {designForm.processing ? 'Mengunggah...' : needsRevisionUpload ? 'Upload Revisi Desain' : 'Upload Desain'}
                                </Button>
                            </form>
                        ) : (
                            <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-md border border-slate-100 flex flex-col justify-center items-center text-center h-full">
                                {workflow.design_approved 
                                    ? <span className="flex flex-col items-center gap-2 text-green-600"><CheckCircle className="size-8"/> Desain sudah di-approve.<br/>Tidak dapat diubah.</span>
                                    : "Menunggu Designer mengunggah desain."
                                }
                            </div>
                        )}

                        {/* Riwayat Desain (List) */}
                        <div className="space-y-4 rounded-lg border bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-2">
                                <h4 className="text-sm font-semibold text-slate-700">Riwayat Desain</h4>
                                {designs.length > 0 && (
                                    <a
                                        href={route('designs.export-pdf', activeOrder.id)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                                    >
                                        <Download className="size-3.5" /> Export PDF
                                    </a>
                                )}
                            </div>

                            <div className="max-h-100 space-y-3 overflow-y-auto pr-2">
                                {designs.length === 0 ? (
                                    <p className="text-xs italic text-slate-500">Belum ada desain yang diunggah.</p>
                                ) : (
                                    designs.map((d: any) => (
                                        <div
                                            key={d.id}
                                            className={`rounded border p-3 text-sm ${
                                                d.status === 'approved' ? 'border-emerald-200 bg-emerald-50'
                                                : d.status === 'revision_needed' ? 'border-amber-200 bg-amber-50'
                                                : 'bg-white'
                                            }`}
                                        >
                                            <div className="mb-2 flex items-start justify-between">
                                                <span className="text-xs font-medium text-slate-900">
                                                    {new Date(d.uploaded_at || d.created_at).toLocaleDateString('id-ID')}
                                                </span>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                                    d.status === 'approved' ? 'bg-emerald-200 text-emerald-800'
                                                    : d.status === 'revision_needed' ? 'bg-amber-200 text-amber-800'
                                                    : 'bg-slate-200 text-slate-700'
                                                }`}>
                                                    {d.status.replace('_', ' ')}
                                                </span>
                                            </div>

                                            {d.file_path && (
                                                <button
                                                    type='button'
                                                    onClick={() => openDesignPreview(`/storage/${d.file_path}`, `Design #${d.id}`)}
                                                    className="block cursor-pointer"
                                                >
                                                    {isPdf(d.file_path) ? (
                                                        <iframe
                                                            src={`/storage/${d.file_path}#toolbar=0`}
                                                            className="pointer-events-none mb-2 h-40 w-full rounded border"
                                                        />
                                                    ) : (
                                                        <img
                                                            src={`/storage/${d.file_path}`}
                                                            alt="Thumbnail desain"
                                                            className="mb-2 h-40 w-full rounded border object-cover"
                                                        />
                                                    )}
                                                </button>
                                            )}
                                            <div className="mb-3 flex items-center gap-2">
                                                <a
                                                    href={route('design.export-pdf', d.id)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                                                >
                                                    <Download className="size-3.5" />
                                                    Export PDF
                                                </a>

                                                {d.status === 'waiting_approval' && can('designs.upload') && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-red-600 hover:text-red-600"
                                                        onClick={() => handleDeleteDesign(d.id)}
                                                    >
                                                        <Trash2 className="mr-1 size-3.5" />
                                                        Hapus
                                                    </Button>
                                                )}
                                            </div>

                                            {d.revision_note && (
                                                <div className="mb-2 rounded border border-red-100 bg-red-50 p-2 text-xs text-red-700">
                                                    <p className="font-semibold">Catatan Revisi:</p>
                                                    <p>{d.revision_note}</p>
                                                </div>
                                            )}

                                            {d.designer_revision_note && (
                                                <div className="mb-2 rounded border border-blue-100 bg-blue-50 p-2 text-xs text-blue-700">
                                                    <p className="font-semibold">Catatan Designer:</p>
                                                    <p>{d.designer_revision_note}</p>
                                                </div>
                                            )}

                                            {/* Action Buttons (Approve / Revisi) */}
                                            {['waiting_approval', 'approved'].includes(d.status) && can('designs.approve') && (
                                                <div className="space-y-3 mt-3 border-t border-slate-200 pt-3">
                                                    <div className="flex gap-2">
                                                        {d.status === 'waiting_approval' && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50"
                                                                onClick={() => handleApproveDesign(d.id)}
                                                            >
                                                                <CheckCircle className="mr-1 size-3" /> Setujui
                                                            </Button>
                                                        )}
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 border-red-200 text-xs text-red-700 hover:bg-red-50"
                                                            onClick={() => setRevisionDesignId(d.id)}
                                                        >
                                                            <XCircle className="mr-1 size-3" /> {d.status === 'approved' ? 'Revisi Ulang' : 'Revisi'}
                                                        </Button>
                                                    </div>

                                                    {revisionDesignId === d.id && (
                                                        <div className="space-y-2">
                                                            {d.status === 'approved' && (
                                                                <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                                                                    Desain ini sudah disetujui. Jika direvisi, approval dibatalkan.
                                                                </div>
                                                            )}
                                                            <Textarea
                                                                className="w-full rounded-md border-slate-300 text-xs shadow-sm"
                                                                rows={3}
                                                                value={revisionForm.data.revision_note}
                                                                onChange={(e) => revisionForm.setData('revision_note', e.target.value)}
                                                                placeholder="Tulis catatan revisi..."
                                                            />
                                                            <div className="flex gap-2">
                                                                <Button type="button" size="sm" variant="outline" onClick={() => setRevisionDesignId(null)}>Batal</Button>
                                                                <Button type="button" size="sm" disabled={revisionForm.processing} onClick={() => submitRevision(d.id)}>Kirim Revisi</Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {can('boms.sync') && (
                    <SectionCard title="Master Produk (Sinkronisasi)">
                        <form onSubmit={submitSyncArticle} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Pilih Master Produk</label>
                                <Select
                                    className="text-sm"
                                    classNamePrefix="select"
                                    options={productOptions}
                                    value={
                                        productOptions?.find(
                                            x => x.value === syncArticleForm.data.product_id)
                                    }
                                    onChange={(option) => {
                                        syncArticleForm.setData(
                                            "product_id",
                                            option?.value ?? ""
                                        )
                                    }}
                                    placeholder="Pilih produk..."
                                    isDisabled={Boolean(workflow.quotation_created)}
                                    isSearchable={true}
                                />
                            </div>
                            <Button type="submit" size="sm" className="w-full" disabled={syncArticleForm.processing || workflow.quotation_created || workflow.design_specs_completed}>
                                Simpan / Tautkan
                            </Button>
                        </form>
                    </SectionCard>
                )}

                {/* BAGIAN SPESIFIKASI */}
                <SectionCard title="Spesifikasi (BoM & Manufaktur)">
                    <DesignSpecsPreview
                        activeOrder={activeOrder}
                        materialSpecs={activeOrder.material_specs || []}
                        manufacturingSpecs={activeOrder.manufacturing_specs || []}
                        onCreateMaterial={() => {
                            setEditingMaterialSpec(null);
                            materialSpecForm.reset();
                            setMaterialSpecDialogOpen(true);
                        }}
                        onEditMaterial={(spec) => {
                            setEditingMaterialSpec(spec);
                            Object.keys(materialSpecForm.data).forEach((key) => {
                                materialSpecForm.setData(key as any, spec[key] ?? '');
                            });
                            setMaterialSpecDialogOpen(true);
                        }}
                        onDeleteMaterial={(spec) => {
                            if (confirm(`Hapus material spec ${spec.material_name_snapshot}?`)) {
                                router.delete(route('design-material-specs.destroy', spec.id), { preserveScroll: true, onSuccess: () => toast.success('Dihapus.') });
                            }
                        }}
                        onCreateManufacturing={() => {
                            setEditingManufacturingSpec(null);
                            manufacturingSpecForm.reset();
                            setManufacturingSpecDialogOpen(true);
                        }}
                        onEditManufacturing={(spec) => {
                            setEditingManufacturingSpec(spec);
                            Object.keys(manufacturingSpecForm.data).forEach((key) => {
                                manufacturingSpecForm.setData(key as any, spec[key] ?? '');
                            });
                            setManufacturingSpecDialogOpen(true);
                        }}
                        onDeleteManufacturing={(spec) => {
                            if (confirm(`Hapus manufacturing spec ${spec.work_name_snapshot}?`)) {
                                router.delete(route('design-manufacturing-specs.destroy', spec.id), { preserveScroll: true, onSuccess: () => toast.success('Dihapus.') });
                            }
                        }}
                    />
                </SectionCard>
            </div>
            

            {/* DIALOGS */}
            <DesignPreviewDialog
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                fileUrl={selectedPreview?.url || null}
                title={selectedPreview?.title || 'Preview Design'}
            />

            <MaterialSpecEditDialog
                open={materialSpecDialogOpen}
                onOpenChange={setMaterialSpecDialogOpen}
                spec={editingMaterialSpec}
                form={materialSpecForm}
                suppliers={supplierOptions}
                colors={colors}
                units={units}
                onSubmit={submitMaterialSpec}
                mode={editingMaterialSpec ? 'edit' : 'create'}
            />

            <ManufacturingSpecEditDialog
                open={manufacturingSpecDialogOpen}
                onOpenChange={setManufacturingSpecDialogOpen}
                spec={editingManufacturingSpec}
                form={manufacturingSpecForm}
                suppliers={supplierOptions}
                onSubmit={submitManufacturingSpec}
                mode={editingManufacturingSpec ? 'edit' : 'create'}
                enableProcessBehavior={true}
            />
        </div>
    );
};

export default DesignAndSpecsTab;