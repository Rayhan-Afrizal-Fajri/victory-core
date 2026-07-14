import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMemo, useRef, useState, useEffect, FormEvent } from "react";
import { CompanyProfile, Customer } from "../types";
import { useCan } from "@/hooks/use-can";
import Field from "@/components/sample/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";

// Import komponen form dialog Anda
import { FormDialog } from '@/components/crud/form-dialog';
import { CustomerForm } from '@/components/forms/customer/customer-form';
import { store as customerStore, update as customerUpdate, destroy as customerDestroy } from '@/routes/customers';

type Props = {
    form: any;
    customers: Customer[]
    companyProfiles: CompanyProfile[];
    disabled: boolean;
}

export default function CustomerSelector({ form, customers, companyProfiles, disabled }: Props) {
    const can = useCan();

    const [customerSearch, setCustomerSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Form Inertia khusus untuk tambah customer
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

    // 1. Logika Klik Outside untuk menutup dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedCustomer = useMemo(() => {
        return customers.find((c) => String(c.id) === String(form.data.customer_id));
    }, [customers, form.data.customer_id]);

    const filteredCustomers = useMemo(() => {
        const keyword = customerSearch.toLowerCase().trim();
        if (!keyword) return customers.slice(0, 20);
        return customers.filter((c) => c.name.toLowerCase().includes(keyword)).slice(0, 20);
    }, [customers, customerSearch]);

    // 2. Handler untuk submit customer baru
    const handleSubmitCustomer = () => {        
        // Sesuaikan route('customers.store') dengan route name backend Anda
        customerForm.post(customerStore().url, {
            onSuccess: () => {
                toast.success('Customer berhasil disimpan.');
                setIsDialogOpen(false);
                customerForm.reset();
            },
            onError: (err) => {
                toast.error(Object.values(err)[0] as string || 'Gagal menyimpan customer.');
            }
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
                />
            </div>

            {/* Bagian Dropdown Customer */}
            <div className="space-y-2" ref={dropdownRef}>
                <Label>Customer / Brand *</Label>
                <div className="relative">
                    <Input
                        readOnly={!can('dashboard.admin')}
                        value={selectedCustomer && !isDropdownOpen ? selectedCustomer.name : customerSearch}
                        onChange={(e) => { setCustomerSearch(e.target.value); setIsDropdownOpen(true); }}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder="Cari customer..."
                        className="w-full"
                        disabled={disabled}
                    />
                    
                    {isDropdownOpen && (
                        <div className="absolute left-0 top-full z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                            {filteredCustomers.length > 0 ? (
                                filteredCustomers.map((c) => (
                                    <button
                                        key={c.id} 
                                        type="button"
                                        onClick={() => { 
                                            form.setData('customer_id', String(c.id)); 
                                            setCustomerSearch(c.name); 
                                            setIsDropdownOpen(false); 
                                        }}
                                        className="block w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-slate-100"
                                    >
                                        {`${c.name} - ${c.company_name}`}
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-2 text-sm text-slate-500 italic">Customer tidak ditemukan</div>
                            )}

                            {can('dashboard.admin') && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Auto-fill nama dari apa yang sudah diketik user
                                        customerForm.setData('nama', customerSearch);
                                        setIsDropdownOpen(false);
                                        setIsDialogOpen(true);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm font-medium text-blue-600 bg-slate-50 mt-1 border-t border-slate-100 hover:bg-blue-50"
                                >
                                    + Buat Customer Baru
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. Modal Add Customer */}
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

            <Field label='Perusahaan *'>
                <Select value={form.data.company_profile_id || ''} onValueChange={(value) => form.setData('company_profile_id', value)} disabled={disabled}>
                    <SelectTrigger className="h-10 w-full border-slate-200 bg-white shadow-sm">
                        <SelectValue placeholder="Pilih perusahaan" />
                    </SelectTrigger>
                    <SelectContent>
                        {companyProfiles.map((option) => (
                            <SelectItem key={option.id} value={String(option.id)}>{option.name} - {option.type}</SelectItem>
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
                />
            </div>
        </div>
    )
}