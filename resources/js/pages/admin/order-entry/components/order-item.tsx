import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FormattedNumberInput from '@/components/ui/formatted-number-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrderData, emptySizeRow } from '../types';

type OrderItemProps = {
  order: OrderData;
  oIndex: number;
  isRemovable: boolean;
  productNamesInUse: string[];
  defaultSizeBreakdowns?: { color: string[]; fabric: string[]; size: string[] };
  onChange: (updatedOrder: OrderData) => void;
  onRemove: () => void;
  isApproved: boolean;
};

export default function OrderItem({ order, oIndex, isRemovable, productNamesInUse, defaultSizeBreakdowns, onChange, onRemove, isApproved }: OrderItemProps) {
  // State UI "Custom Input" dilokalisasi di sini, menggunakan index number (sIndex) saja
  const [customInputs, setCustomInputs] = useState<Record<number, { color?: boolean; fabric_spec?: boolean; size_label?: boolean }>>({});

  const updateField = (field: keyof OrderData, value: any) => {
    onChange({ ...order, [field]: value });
  };

  const handleAddSize = () => {
    onChange({ ...order, size_breakdowns: [...order.size_breakdowns, { ...emptySizeRow }] });
  };

  const handleRemoveSize = (sizeIndex: number) => {
    const newSizes = order.size_breakdowns.filter((_, i) => i !== sizeIndex);
    onChange({ ...order, size_breakdowns: newSizes.length ? newSizes : [{ ...emptySizeRow }] });
  };

  const updateSize = (sizeIndex: number, field: string, value: string | number) => {
    const newSizes = [...order.size_breakdowns];
    newSizes[sizeIndex] = { ...newSizes[sizeIndex], [field]: field === 'qty' ? Number(value) : value };
    onChange({ ...order, size_breakdowns: newSizes });
  };

  const toggleCustomInput = (sizeIndex: number, field: 'color' | 'fabric_spec' | 'size_label') => {
    setCustomInputs((prev) => ({
      ...prev, [sizeIndex]: { ...prev[sizeIndex], [field]: !prev[sizeIndex]?.[field] }
    }));
  };

  const isDuplicate = productNamesInUse.filter((name) => name === order.requested_product_name?.trim().toLowerCase()).length > 1;
  const totalSizeQty = order.size_breakdowns.reduce((acc, curr) => acc + Number(curr.qty || 0), 0);
  const isSizeEmpty = order.size_breakdowns.length === 1 && !order.size_breakdowns[0].color && !order.size_breakdowns[0].size_label;
  const sizeIsValid = totalSizeQty === Number(order.q || 0);

  return (
    <div className="relative rounded-lg border border-slate-200 p-5 pt-7 bg-slate-50/50">
      <span className="absolute top-2 left-3 text-xs font-bold text-slate-400">Pesanan #{oIndex + 1}</span>
      
      {isRemovable && (
        <Button type="button" variant="ghost" size="sm" className="absolute top-2 right-2 text-red-500 h-6 px-2 hover:bg-red-100" onClick={onRemove}>
          Hapus
        </Button>
      )}

      <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr] mt-2">
        <div className="space-y-2">
          <Label>Nama Produk / Artikel *</Label>
          <Input
            placeholder="cth. T-Shirt Oversize Hitam"
            value={order.requested_product_name}
            onChange={(e) => updateField('requested_product_name', e.target.value)}
            required
            disabled={isApproved}
          />
          {isDuplicate && <p className="text-xs text-red-500">Nama produk harus unik antar pesanan.</p>}
        </div>
        <div className="space-y-2">
          <Label>Quantity Produksi *</Label>
          <FormattedNumberInput value={order.q} onValueChange={(val) => updateField('q', val)} placeholder="Jumlah" disabled={isApproved} />
        </div>
      </div>

      <div className="mt-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <Label className="text-xs font-semibold text-slate-600">Detail Ukuran / Size Breakdown</Label>
          <Button type="button" variant="secondary" size="sm" className="h-7 text-xs shrink-0" onClick={handleAddSize}>
            + Tambah Size
          </Button>
        </div>

        {/* space-y-4 pada mobile agar tiap "card" berjarak, space-y-2 pada desktop */}
        <div className="space-y-4 sm:space-y-2">
          {order.size_breakdowns.map((size, sIndex) => {
            const isCustomColor =
              Boolean(customInputs[sIndex]?.color) ||
              (!!size.color && !defaultSizeBreakdowns?.color.includes(size.color));

            const isCustomFabric =
              Boolean(customInputs[sIndex]?.fabric_spec) ||
              (!!size.fabric_spec && !defaultSizeBreakdowns?.fabric.includes(size.fabric_spec));

            const isCustomSize =
              Boolean(customInputs[sIndex]?.size_label) ||
              (!!size.size_label && !defaultSizeBreakdowns?.size.includes(size.size_label));

            return (
              <div 
                key={sIndex} 
                // Mobile: 12-column grid dengan background, padding, dan border seperti "Card"
                // Desktop: 5-column grid custom dengan background flat seperti tabel biasa
                className="grid grid-cols-12 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_100px_40px] gap-3 sm:gap-2 items-start bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-md sm:rounded-none border border-slate-100 sm:border-transparent"
              >
                {/* FIELD COLOR (Mobile: 50% lebar, Desktop: auto/1 bagian) */}
                <div className="col-span-6 sm:col-span-1 space-y-1">
                  {isCustomColor ? (
                    <div className="space-y-1">
                      <Input placeholder="Warna" value={size.color} onChange={(e) => updateSize(sIndex, 'color', e.target.value)} className="w-full" />
                      <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs shrink-0" onClick={() => toggleCustomInput(sIndex, 'color')}>List</Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Select value={size.color || ''} onValueChange={(value) => updateSize(sIndex, 'color', value)}>
                        <SelectTrigger className="h-10 w-full border-slate-200 bg-white shadow-sm">
                          <SelectValue placeholder="Pilih warna" />
                        </SelectTrigger>
                        <SelectContent>
                          {defaultSizeBreakdowns?.color.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Text rata kiri di mobile agar area klik lebih nyaman */}
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs w-full sm:w-auto text-left justify-start sm:justify-center" onClick={() => toggleCustomInput(sIndex, 'color')}>+ Custom</Button>
                    </div>
                  )}
                </div>

                {/* FIELD FABRIC SPEC (Mobile: 50% lebar, Desktop: auto/1 bagian) */}
                <div className="col-span-6 sm:col-span-1 space-y-1">
                  {isCustomFabric ? (
                    <div className="space-y-1">
                      <Input placeholder="Fabric (24s)" value={size.fabric_spec} onChange={(e) => updateSize(sIndex, 'fabric_spec', e.target.value)} className="w-full" />
                      <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs shrink-0" onClick={() => toggleCustomInput(sIndex, 'fabric_spec')}>List</Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Select value={size.fabric_spec || ''} onValueChange={(value) => updateSize(sIndex, 'fabric_spec', value)}>
                        <SelectTrigger className="h-10 w-full border-slate-200 bg-white shadow-sm">
                          <SelectValue placeholder="Pilih fabric" />
                        </SelectTrigger>
                        <SelectContent>
                          {defaultSizeBreakdowns?.fabric.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs w-full sm:w-auto text-left justify-start sm:justify-center" onClick={() => toggleCustomInput(sIndex, 'fabric_spec')}>+ Custom</Button>
                    </div>
                  )}
                </div>

                {/* FIELD SIZE LABEL (Mobile: 50% lebar di baris ke-2, Desktop: auto/1 bagian) */}
                <div className="col-span-6 sm:col-span-1 space-y-1">
                  {isCustomSize ? (
                    <div className="space-y-1">
                      <Input placeholder="Size (S/M/L)" value={size.size_label} onChange={(e) => updateSize(sIndex, 'size_label', e.target.value)} className="w-full" />
                      <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs shrink-0" onClick={() => toggleCustomInput(sIndex, 'size_label')}>List</Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Select value={size.size_label || ''} onValueChange={(value) => updateSize(sIndex, 'size_label', value)}>
                        <SelectTrigger className="h-10 w-full border-slate-200 bg-white shadow-sm">
                          <SelectValue placeholder="Pilih size" />
                        </SelectTrigger>
                        <SelectContent>
                          {defaultSizeBreakdowns?.size.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs w-full sm:w-auto text-left justify-start sm:justify-center" onClick={() => toggleCustomInput(sIndex, 'size_label')}>+ Custom</Button>
                    </div>
                  )}
                </div>

                {/* FIELD QTY (Mobile: ~33% lebar dikanan Size, Desktop: 100px fixed) */}
                <div className="col-span-4 sm:col-span-1">
                  <FormattedNumberInput value={size.qty} onValueChange={(val) => updateSize(sIndex, 'qty', Number(val))} className="w-full" />
                </div>
                
                {/* FIELD REMOVE (Mobile: sisa lebar di kanan Qty rata kanan, Desktop: 40px fixed) */}
                <div className="col-span-2 sm:col-span-1 flex justify-end">
                  <Button type="button" variant="outline" size="icon" className="text-red-500 shrink-0" onClick={() => handleRemoveSize(sIndex)}>×</Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className={`mt-3 rounded border p-2 text-xs ${isSizeEmpty || sizeIsValid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
          Total Size Breakdown: <strong>{isSizeEmpty ? 0 : totalSizeQty}</strong> / <strong>{order.q || 0}</strong> {isSizeEmpty && <span className="italic">(Opsional)</span>}
        </div>
      </div>
    </div>
  );
}