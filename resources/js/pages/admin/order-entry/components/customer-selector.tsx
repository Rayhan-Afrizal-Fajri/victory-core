import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import { CompanyProfile, Customer } from "../types";
import { useCan } from "@/hooks/use-can";
import Field from "@/components/sample/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";

// Import komponen form dialog & SearchableSelect universal
import { FormDialog } from '@/components/crud/form-dialog';
import { CustomerForm } from '@/components/forms/customer/customer-form';
import { SearchableSelect, SearchableOption } from '@/components/ui/searchable-select';
import { store as customerStore } from '@/routes/customers';

type Props = {
    form: any;
    customers: Customer[];
    companyProfiles: CompanyProfile[];
    disabled: boolean;
};

export default function CustomerSelector({ form, customers, companyProfiles, disabled }: Props) {
    const can = useCan();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form Inertia khusus untuk tambah customer baru
    const customerForm = useForm({
        nama: '',
        jabatan: '',
        nama_perusahaan: '',
        no_hp: '',
        provinsi: '',
        kota: '',
        kecamatan: '',
        kelurahan: '',
        alamat_detail: '',
    });

    // Transform data customer ke SearchableOption dengan multi-keyword (nama, perusahaan, kontak, dll)
    const customerOptions = useMemo<SearchableOption[]>(() => {
        return (customers || []).map((c) => ({
            value: String(c.id),
            label: c.name,
            subLabel: c.company_name || 'Personal',
            keywords: [c.company_name, c.name, c.contact, (c as any).city, (c as any).province].filter(Boolean) as string[],
            raw: c,
        }));
    }, [customers]);

    // Handler untuk submit customer baru
    const handleSubmitCustomer = () => {
        customerForm.post(customerStore().url, {
            onSuccess: () => {
                toast.success('Customer berhasil disimpan.');
                setIsDialogOpen(false);
                customerForm.reset();
            },
            onError: (err) => {
                toast.error((Object.values(err)[0] as string) || 'Gagal menyimpan customer.');
            },
        });
    };

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
                <Label>No Purchase Order *</Label>
                <Input readOnly value={form.data.no_job_ticket} required />
            </div>

            <div className="space-y-2">
                <Label>Deadline Purchase Order *</Label>
                <Input
                    type="date"
                    value={form.data.deadline}
                    onChange={(e) => form.setData('deadline', e.target.value)}
                    required
                    disabled={disabled}
                />
            </div>

            {/* Bagian Dropdown Customer dengan Single Source of Truth: SearchableSelect */}
            <div className="space-y-2">
                <Label>Customer / Brand *</Label>
                <SearchableSelect
                    options={customerOptions}
                    value={form.data.customer_id}
                    onChange={(val) => form.setData('customer_id', val)}
                    placeholder="Pilih customer / brand..."
                    searchPlaceholder="Cari nama customer, company, kontak..."
                    emptyMessage="Customer tidak ditemukan."
                    disabled={disabled}
                    readOnly={!can('dashboard.admin')}
                    actionButton={
                        can('dashboard.admin')
                            ? {
                                  label: '+ Buat Customer Baru',
                                  onClick: (keyword) => {
                                      customerForm.setData('nama', keyword);
                                      setIsDialogOpen(true);
                                  },
                              }
                            : undefined
                    }
                />

                {/* Modal Add Customer */}
                <FormDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    title="Tambah Customer"
                    description="Kelola data customer baru"
                    submitLabel="Simpan Customer"
                    loading={customerForm.processing}
                    onSubmit={handleSubmitCustomer}
                    isButtonAdd={false}
                >
                    <CustomerForm form={customerForm} />
                </FormDialog>
            </div>

            <Field label="Perusahaan *">
                <Select
                    value={form.data.company_profile_id || ''}
                    onValueChange={(value) => form.setData('company_profile_id', value)}
                    disabled={disabled}
                >
                    <SelectTrigger className="h-10 w-full border-slate-200 bg-white shadow-sm">
                        <SelectValue placeholder="Pilih perusahaan" />
                    </SelectTrigger>
                    <SelectContent>
                        {companyProfiles.map((option) => (
                            <SelectItem key={option.id} value={String(option.id)}>
                                {option.name} - {option.type}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>

            <div className="space-y-2">
                <Label>Nama Sales *</Label>
                <Input
                    type="text"
                    value={form.data.sales_name}
                    onChange={(e) => form.setData('sales_name', e.target.value)}
                    disabled={disabled}
                />
            </div>
        </div>
    );
}