import SectionCard from "@/pages/admin/job-tickets/components/SectionCard";
import EmptyState from "./empty-state";
import { PackageCheck, Truck } from "lucide-react";
import Field from "./field";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import InfoLine from "./info-line";

const SampleDeliveryCard = ({
    sample,
    delivery,
    canDeliver,
    canMarkDelivered,
    deliveryForm,
    onSubmitDelivery,
    onMarkDelivered,
}: {
    sample: any;
    delivery: any;
    canDeliver: boolean;
    canMarkDelivered: boolean;
    deliveryForm: any;
    onSubmitDelivery: (e: React.FormEvent) => void;
    onMarkDelivered: () => void;
}) => {

    return (
        <SectionCard title="Delivery Sample">
            {!sample && (
                <EmptyState
                    icon={<Truck className="size-5" />}
                    title="Delivery belum tersedia"
                    description="Buat sample terlebih dahulu sebelum mengatur pengiriman."
                />
            )}

            {sample && !canDeliver && !canMarkDelivered && sample.status !== 'delivered' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Sample belum bisa dikirim. Pastikan invoice sample sudah lunas dan payment sudah diverifikasi.
                </div>
            )}

            {canDeliver && (
                <form onSubmit={onSubmitDelivery} className="space-y-3">
                    <Field label="Jasa Kirim" error={deliveryForm.errors.courier_name}>
                        <Input
                            placeholder="JNE / J&T / GoSend / Internal Courier"
                            value={deliveryForm.data.courier_name}
                            onChange={(e) => deliveryForm.setData('courier_name', e.target.value)}
                        />
                    </Field>

                    <Field label="Nomor Resi" error={deliveryForm.errors.tracking_number}>
                        <Input
                            placeholder="Opsional untuk kurir internal"
                            value={deliveryForm.data.tracking_number}
                            onChange={(e) => deliveryForm.setData('tracking_number', e.target.value)}
                        />
                    </Field>

                    <Field label="Tracking URL" error={deliveryForm.errors.tracking_url}>
                        <Input
                            placeholder="https://..."
                            value={deliveryForm.data.tracking_url}
                            onChange={(e) => deliveryForm.setData('tracking_url', e.target.value)}
                        />
                    </Field>

                    <Field label="Catatan Pengiriman" error={deliveryForm.errors.delivery_note}>
                        <Textarea
                            rows={3}
                            value={deliveryForm.data.delivery_note}
                            onChange={(e) => deliveryForm.setData('delivery_note', e.target.value)}
                        />
                    </Field>

                    <Button type="submit" disabled={deliveryForm.processing}>
                        <Truck className="mr-2 size-4" />
                        Mark as Shipped
                    </Button>
                </form>
            )}

            {canMarkDelivered && (
                <div className="space-y-3 rounded-xl border bg-slate-50 p-4 text-sm">
                    <InfoLine label="Courier" value={delivery?.courier_name ?? '-'} />
                    <InfoLine label="Resi" value={delivery?.tracking_number ?? '-'} />
                    <InfoLine label="Status" value={delivery?.status ?? 'shipped'} />

                    {delivery?.tracking_url && (
                        <div>
                            <a
                                href={delivery.tracking_url}
                                target="_blank"
                                className="inline-block text-blue-600 hover:underline"
                            >
                                Buka Tracking
                            </a>
                        </div>
                    )}

                    <Button type="button" onClick={onMarkDelivered}>
                        <PackageCheck className="mr-2 size-4" />
                        Mark as Delivered
                    </Button>
                </div>
            )}

            {sample?.status === 'delivered' && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    Sample sudah diterima customer dan siap direview.
                </div>
            )}
        </SectionCard>
    );
};

export default SampleDeliveryCard;