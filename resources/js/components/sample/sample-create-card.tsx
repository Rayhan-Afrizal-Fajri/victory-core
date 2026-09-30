import SectionCard from "@/pages/admin/job-tickets/components/SectionCard";
import Field from "./field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import FormImageUpload from "../ui/form-image";
import { Button } from "../ui/button";
import { Upload } from "lucide-react";
import FormattedNumberInput from "../ui/formatted-number-input";

const SampleCreateCard = ({
    form,
    mode = 'create',
    revisionSourceSample,
    onSubmit,
}: {
    form: any;
    onSubmit: (e: React.FormEvent) => void;
    mode?: 'create' | 'revision',
    revisionSourceSample?: any
}) => {
    return (
        <SectionCard title="Buat Sample">
            <form onSubmit={onSubmit} className="space-y-5">
                <div
                    className={`rounded-xl border p-4 ${
                        mode === 'revision'
                            ? 'border-amber-200 bg-amber-50'
                            : 'bg-slate-50'
                    }`}
                >
                    <p className="text-sm font-semibold text-slate-800">
                        {mode === 'revision'
                            ? `Buat sample revisi dari Sample #${revisionSourceSample?.revision_number ?? 0}`
                            : 'Upload sample pertama.'}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        {mode === 'revision'
                            ? 'Sample revisi akan menjadi sample aktif baru. Sample sebelumnya tetap tersimpan sebagai riwayat.'
                            : 'Setelah sample dibuat, sistem akan membuat invoice sample otomatis jika opsi invoice aktif.'}
                    </p>

                    {mode === 'revision' && revisionSourceSample?.customer_review_note && (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-white p-3 text-xs text-amber-800">
                            <p className="font-semibold">Catatan revisi customer:</p>
                            <p className="mt-1">{revisionSourceSample.customer_review_note}</p>
                        </div>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Qty Sample" error={form.errors.qty}>
                        <FormattedNumberInput
                            value={form.data.qty}
                            onValueChange={(value) => form.setData('qty', value)}
                            placeholder='cth: 2'
                        />
                    </Field>

                    <Field label="Harga Sample" error={form.errors.sample_price}>
                        <FormattedNumberInput
                            value={form.data.sample_price}
                            onValueChange={(value) => form.setData('sample_price', value)}
                            placeholder='cth: 35.000'
                        />
                    </Field>
                </div>

                <label className="flex items-start gap-3 rounded-xl border p-4 text-sm">
                    <input
                        type="checkbox"
                        className="mt-1"
                        checked={form.data.is_chargeable}
                        onChange={(e) => form.setData('is_chargeable', e.target.checked)}
                    />
                    <span>
                        <span className="block font-medium text-slate-800">
                            Generate invoice sample untuk customer
                        </span>
                        <span className="text-xs text-slate-500">
                            Matikan opsi ini jika sample revisi gratis atau biaya ditanggung internal.
                        </span>
                    </span>
                </label>

                <Field label="Catatan Sample" error={form.errors.catatan}>
                    <Textarea
                        rows={3}
                        value={form.data.catatan}
                        onChange={(e) => form.setData('catatan', e.target.value)}
                        placeholder="Contoh: Sample hoodie fleece, warna navy, bordir dada kiri."
                    />
                </Field>

                <FormImageUpload
                    label="Upload Foto Sample"
                    hint="Upload foto sample yang akan direview customer."
                    onChange={(file) => form.setData('photos', file ? [file] : [])}
                    error={(form.errors as any).photos}
                />

                <Button type="submit" disabled={form.processing}>
                    <Upload className="mr-2 size-4" />
                    {form.processing
                        ? 'Menyimpan...'
                        : mode === 'revision'
                            ? 'Create Revision Sample'
                            : 'Create Sample & Generate Invoice'}
                </Button>
            </form>
        </SectionCard>
    );
};

export default SampleCreateCard;