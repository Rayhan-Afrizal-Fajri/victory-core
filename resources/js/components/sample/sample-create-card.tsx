import SectionCard from "@/pages/admin/job-tickets/components/SectionCard";
import Field from "./field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import FormImageUpload from "../ui/form-image";
import { Button } from "../ui/button";
import { Upload } from "lucide-react";

const SampleCreateCard = ({
    form,
    onSubmit,
}: {
    form: any;
    onSubmit: (e: React.FormEvent) => void;
}) => {
    return (
        <SectionCard title="Buat Sample">
            <form onSubmit={onSubmit} className="space-y-5">
                <div className="rounded-xl border bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">
                        Upload sample pertama atau sample revisi.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Setelah sample dibuat, sistem akan membuat invoice sample otomatis jika opsi invoice aktif.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Qty Sample" error={form.errors.qty}>
                        <Input
                            type="number"
                            min={1}
                            value={form.data.qty}
                            onChange={(e) => form.setData('qty', Number(e.target.value))}
                        />
                    </Field>

                    <Field label="Harga Sample" error={form.errors.sample_price}>
                        <Input
                            type="number"
                            min={0}
                            value={form.data.sample_price}
                            onChange={(e) => form.setData('sample_price', Number(e.target.value))}
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
                    {form.processing ? 'Menyimpan...' : 'Create Sample & Generate Invoice'}
                </Button>
            </form>
        </SectionCard>
    );
};

export default SampleCreateCard;