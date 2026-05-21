import { useForm, router } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import type { JobTicket } from '../../types';
import SectionCard from '../SectionCard';
import FormImageUpload from '@/components/ui/form-image';
import { Button } from '@/components/ui/button';

import { store } from '@/routes/designs';
import { sync } from '@/routes/specifications';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const emptySpec = {
    jenis_spesifikasi: '',
    value: '',
};

const DesignAndSpecsTab: React.FC<{ job: JobTicket }> = ({ job }) => {
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
        customer_revision_note: '',
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

    return (
        <div className="space-y-8">
            <SectionCard title="Spesifikasi Artikel">
                <form onSubmit={submitSpecs} className="space-y-4">
                    {specsForm.data.specs.map((spec: any, index: number) => (
                        <div key={index} className="flex items-start gap-3">
                            <div className="w-1/3">
                                <Input
                                    type="text"
                                    placeholder="Jenis (Bahan, Sablon, dll)"
                                    className="w-full rounded-md border-slate-300 text-sm shadow-sm"
                                    value={spec.jenis_spesifikasi}
                                    onChange={(e) =>
                                        handleSpecChange(
                                            index,
                                            'jenis_spesifikasi',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />
                            </div>

                            <div className="flex w-full gap-2">
                                <Input
                                    type="text"
                                    placeholder="Detail nilai spesifikasi..."
                                    className="w-full rounded-md border-slate-300 text-sm shadow-sm"
                                    value={spec.value}
                                    onChange={(e) =>
                                        handleSpecChange(
                                            index,
                                            'value',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleRemoveSpec(index)}
                                    className="shrink-0 text-red-500 hover:bg-red-50"
                                >
                                    <Trash2 className="size-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center justify-between border-t pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleAddSpec}
                            className="text-sm"
                        >
                            <Plus className="mr-2 size-4" />
                            Tambah Spesifikasi
                        </Button>

                        <Button
                            type="submit"
                            disabled={specsForm.processing}
                            className="bg-slate-900 text-white"
                        >
                            {specsForm.processing
                                ? 'Menyimpan...'
                                : 'Simpan Spesifikasi'}
                        </Button>
                    </div>
                </form>
            </SectionCard>

            <SectionCard title="Manajemen Desain & Revisi">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <form onSubmit={submitDesign} className="space-y-4">
                        <FormImageUpload
                            label={
                                needsRevisionUpload
                                    ? 'Upload Desain Revisi'
                                    : 'Upload Desain'
                            }
                            onChange={(file) =>
                                designForm.setData('file_desain', file)
                            }
                            hint="Upload file desain untuk direview customer."
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
                            latestDesign?.customer_revision_note && (
                                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                    <p className="font-semibold">
                                        Catatan revisi dari customer:
                                    </p>
                                    <p>{latestDesign.customer_revision_note}</p>
                                </div>
                            )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={
                                designForm.processing ||
                                !designForm.data.file_desain
                            }
                        >
                            {designForm.processing
                                ? 'Mengunggah...'
                                : needsRevisionUpload
                                  ? 'Upload Revisi Desain'
                                  : 'Upload Desain'}
                        </Button>
                    </form>

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
                                            <img
                                                src={`/storage/${d.file_path}`}
                                                alt="Thumbnail desain"
                                                className="mb-2 h-16 w-16 rounded border object-cover"
                                            />
                                        )}

                                        {d.customer_revision_note && (
                                            <div className="mb-2 rounded border border-red-100 bg-red-50 p-2 text-xs text-red-700">
                                                <p className="font-semibold">
                                                    Catatan customer:
                                                </p>
                                                <p>{d.customer_revision_note}</p>
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

                                        {['waiting_approval', 'approved'].includes(d.status) && (
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
                                                            value={revisionForm.data.customer_revision_note}
                                                            onChange={(e) =>
                                                                revisionForm.setData(
                                                                    'customer_revision_note',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="Tulis catatan revisi dari customer..."
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
                    </div>
                </div>
            </SectionCard>
        </div>
    );
};

export default DesignAndSpecsTab;