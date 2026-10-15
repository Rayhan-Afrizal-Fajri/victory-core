import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
  AlertTriangle,
  Check,
  Split,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  Package,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/helpers/format';

export type ProductImportConflict = {
  id: number;
  batch_id: string;
  sheet_index: number;
  sheet_title: string;
  product_name: string;
  existing_product_id: number;
  separated_product_id: number | null;
  status: 'updated' | 'kept' | 'separated';
  matched_fields: {
    field?: string;
    value?: string;
    sheet_title?: string;
    sheet_index?: number;
  };
  previous_data: {
    product: {
      id: number;
      name: string;
      category?: string;
      description?: string;
    };
    materials: Array<{
      material_id: number;
      material_name: string;
      type: string;
      vendor_name?: string;
      harga_ecer?: number;
      harga_roll?: number;
      default_usage?: number;
      default_unit?: string;
      notes?: string;
    }>;
    works: Array<{
      manufacturing_work_id: number;
      work_name: string;
      vendor_name?: string;
      default_usage?: number;
      default_unit?: string;
      min_estimate?: number;
      max_estimate?: number;
      usage_note?: string;
    }>;
  };
  imported_data: {
    product_name: string;
    sheet_title: string;
    sheet_index: number;
    materials: Array<{
      name: string;
      section: string;
      vendor?: string;
      harga_ecer?: number;
      harga_roll?: number;
      usage?: number;
      unit?: string;
      notes?: string;
    }>;
    works: Array<{
      name: string;
      vendor?: string;
      usage?: number;
      unit?: string;
      min_estimate?: number;
      max_estimate?: number;
      notes?: string;
    }>;
  };
  changes_summary: {
    old_materials_count: number;
    new_materials_count: number;
    old_works_count: number;
    new_works_count: number;
    added_materials?: string[];
    removed_materials?: string[];
    added_works?: string[];
    removed_works?: string[];
  };
  existing_product?: any;
};

interface ImportConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: ProductImportConflict[];
  selectedConflictId?: number | null;
}

export default function ImportConflictDialog({
  open,
  onOpenChange,
  conflicts,
  selectedConflictId,
}: ImportConflictDialogProps) {
  const [expandedId, setExpandedId] = useState<number | null>(selectedConflictId || null);
  const [separateNames, setSeparateNames] = useState<Record<number, string>>({});
  const [activeTabs, setActiveTabs] = useState<Record<number, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync expanded ID when selectedConflictId changes
  React.useEffect(() => {
    if (selectedConflictId) {
      setExpandedId(selectedConflictId);
    } else if (conflicts.length > 0 && expandedId === null) {
      setExpandedId(conflicts[0].id);
    }
  }, [selectedConflictId, conflicts]);

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getProposedNewName = (conflict: ProductImportConflict) => {
    if (separateNames[conflict.id] !== undefined) {
      return separateNames[conflict.id];
    }
    const cleanSheet = conflict.sheet_title
      ? conflict.sheet_title.replace(/^\d+[\.\s]*/, '')
      : '';
    if (cleanSheet && cleanSheet.toLowerCase() !== conflict.product_name.toLowerCase()) {
      return cleanSheet;
    }
    return `${conflict.product_name} (Sheet ${conflict.sheet_index})`;
  };

  const handleKeep = (conflict: ProductImportConflict) => {
    setIsProcessing(true);
    router.post(
      `/products/import-conflicts/${conflict.id}/keep`,
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(`Produk "${conflict.product_name}" dikonfirmasi tetap diperbarui.`);
        },
        onError: () => toast.error('Gagal memperbarui status produk.'),
        onFinish: () => setIsProcessing(false),
      }
    );
  };

  const handleSeparate = (conflict: ProductImportConflict) => {
    const newName = getProposedNewName(conflict);
    if (!newName.trim()) {
      toast.error('Nama produk baru tidak boleh kosong.');
      return;
    }

    setIsProcessing(true);
    router.post(
      `/products/import-conflicts/${conflict.id}/separate`,
      {
        new_product_name: newName,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(`Produk baru "${newName}" berhasil dipisahkan!`);
        },
        onError: () => toast.error('Gagal memisahkan produk.'),
        onFinish: () => setIsProcessing(false),
      }
    );
  };

  const handleBulkAction = (action: 'keep_all' | 'separate_all') => {
    const actionLabel = action === 'keep_all' ? 'tetap diperbarui' : 'dipisahkan menjadi produk baru';
    if (!confirm(`Apakah Anda yakin ingin mengatur semua ${conflicts.length} produk untuk ${actionLabel}?`)) {
      return;
    }

    setIsProcessing(true);
    router.post(
      '/products/import-conflicts/bulk',
      {
        action,
        conflict_ids: conflicts.map((c) => c.id),
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(`Aksi massal berhasil diproses.`);
          onOpenChange(false);
        },
        onError: () => toast.error('Gagal memproses aksi massal.'),
        onFinish: () => setIsProcessing(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-5xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader className="space-y-2 border-b pb-4">
          <div className="flex items-center gap-2 text-amber-600 font-semibold text-lg">
            <AlertTriangle className="size-5 shrink-0" />
            <DialogTitle className="text-xl">
              Konfirmasi Data Import Produk Diperbarui
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-600 text-sm leading-relaxed">
            Sistem mendeteksi <strong>{conflicts.length} sheet/data produk</strong> di file Excel yang
            memiliki nama sama dengan produk yang sudah ada di database. Silakan tinjau perbedaan data dan
            pilih apakah produk ini <strong>Tetap Diperbarui</strong> atau <strong>Dipisahkan</strong> menjadi
            produk baru tersendiri.
          </DialogDescription>
        </DialogHeader>

        {conflicts.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <CheckCircle2 className="size-12 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-medium text-slate-700">Semua konflik import telah diselesaikan.</p>
            <p className="text-xs text-slate-500">Tidak ada produk yang perlu ditinjau lagi.</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Action Bar Bulk */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Info className="size-4 text-amber-600 shrink-0" />
                <span>
                  Total <strong>{conflicts.length}</strong> produk menunggu keputusan Anda.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isProcessing}
                  onClick={() => handleBulkAction('keep_all')}
                  className="bg-white hover:bg-emerald-50 hover:text-emerald-700 border-slate-300 text-xs h-8"
                >
                  <Check className="size-3.5 mr-1 text-emerald-600" />
                  Tetapkan Semua Diperbarui
                </Button>
                <Button
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleBulkAction('separate_all')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
                >
                  <Split className="size-3.5 mr-1" />
                  Pisahkan Semua Jadi Baru
                </Button>
              </div>
            </div>

            {/* List Conflicts */}
            <div className="space-y-3">
              {conflicts.map((conflict, idx) => {
                const isExpanded = expandedId === conflict.id;
                const summary = conflict.changes_summary || {
                  old_materials_count: 0,
                  new_materials_count: 0,
                  old_works_count: 0,
                  new_works_count: 0,
                };
                const activeTab = activeTabs[conflict.id] || 'materials';

                return (
                  <div
                    key={conflict.id}
                    className="border border-slate-200 rounded-lg bg-white shadow-xs overflow-hidden transition-all"
                  >
                    {/* Item Header */}
                    <div
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60 hover:bg-slate-50 cursor-pointer"
                      onClick={() => toggleExpand(conflict.id)}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-slate-900 text-base">
                            {conflict.product_name}
                          </span>
                          <Badge variant="outline" className="text-xs bg-white text-slate-600 border-slate-300">
                            Sheet #{conflict.sheet_index}: {conflict.sheet_title}
                          </Badge>
                        </div>

                        {/* Ringkasan Perbedaan */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <span className="size-1.5 rounded-full bg-emerald-500"></span>
                            Data Sama: <span className="text-slate-600 font-normal">Nama Produk Cocok</span>
                          </span>
                          <span>•</span>
                          <span>
                            Bahan:{' '}
                            <strong className="text-slate-700">{summary.old_materials_count}</strong>{' '}
                            <ArrowRight className="size-3 inline mx-0.5 text-slate-400" />{' '}
                            <strong className="text-indigo-600">{summary.new_materials_count}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Manufaktur:{' '}
                            <strong className="text-slate-700">{summary.old_works_count}</strong>{' '}
                            <ArrowRight className="size-3 inline mx-0.5 text-slate-400" />{' '}
                            <strong className="text-indigo-600">{summary.new_works_count}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-slate-600 hover:text-slate-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(conflict.id);
                          }}
                        >
                          {isExpanded ? (
                            <>
                              Tutup Detail <ChevronUp className="size-4 ml-1" />
                            </>
                          ) : (
                            <>
                              Lihat Detail <ChevronDown className="size-4 ml-1" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Item Body / Expansion */}
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-200 space-y-4 bg-white">
                        {/* Highlights Differences */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg text-xs">
                          <div>
                            <span className="font-semibold text-slate-700 block mb-1">
                              Perubahan Bahan ({summary.new_materials_count} item):
                            </span>
                            {summary.added_materials && summary.added_materials.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {summary.added_materials.map((m, i) => (
                                  <Badge key={i} className="bg-emerald-100 text-emerald-800 text-[10px] hover:bg-emerald-100">
                                    + {m}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500">Jumlah bahan sama</span>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-700 block mb-1">
                              Perubahan Manufaktur ({summary.new_works_count} proses):
                            </span>
                            {summary.added_works && summary.added_works.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {summary.added_works.map((w, i) => (
                                  <Badge key={i} className="bg-indigo-100 text-indigo-800 text-[10px] hover:bg-indigo-100">
                                    + {w}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-500">Jumlah pekerjaan sama</span>
                            )}
                          </div>
                        </div>

                        {/* Detailed Table Comparisons (Tabs: Bahan & Manufaktur) */}
                        <Tabs
                          value={activeTab}
                          onValueChange={(val) =>
                            setActiveTabs((prev) => ({ ...prev, [conflict.id]: val }))
                          }
                          className="w-full"
                        >
                          <TabsList className="grid grid-cols-2 w-full max-w-xs">
                            <TabsTrigger value="materials" className="text-xs">
                              <Package className="size-3.5 mr-1.5" />
                              Bahan ({conflict.imported_data.materials?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="works" className="text-xs">
                              <Wrench className="size-3.5 mr-1.5" />
                              Manufaktur ({conflict.imported_data.works?.length || 0})
                            </TabsTrigger>
                          </TabsList>

                          {/* Tab Bahan */}
                          <TabsContent value="materials" className="pt-2">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* Kolom Kiri: Data Sebelumnya */}
                              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60 space-y-2.5">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-slate-400"></span>
                                    Data Lama di Database
                                  </span>
                                  <Badge variant="secondary" className="text-[11px] font-medium">
                                    {conflict.previous_data.materials?.length || 0} Item
                                  </Badge>
                                </div>
                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                  {conflict.previous_data.materials?.length ? (
                                    conflict.previous_data.materials.map((m, i) => (
                                      <div
                                        key={i}
                                        className="text-xs p-2.5 rounded-md bg-white border border-slate-200 shadow-xs flex justify-between items-center gap-3 hover:border-slate-300 transition-colors"
                                      >
                                        <div className="min-w-0 flex-1">
                                          <div className="font-semibold text-slate-900 truncate">
                                            {m.material_name}
                                          </div>
                                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                            <span className="text-slate-700">{m.vendor_name || 'Vendor default'}</span>
                                            <span>•</span>
                                            <span>{m.default_usage} {m.default_unit || 'Unit'}</span>
                                            {m.notes && (
                                              <>
                                                <span>•</span>
                                                <span className="text-slate-400 italic truncate max-w-[150px]">{m.notes}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <div className="text-xs font-semibold text-slate-900">
                                            {formatCurrency(m.harga_ecer || 0)}
                                          </div>
                                          {Boolean(m.harga_roll && m.harga_roll > 0) && (
                                            <div className="text-[10px] text-slate-400">
                                              Roll: {formatCurrency(m.harga_roll)}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-slate-400 italic py-4 text-center">Tidak ada bahan sebelumnya.</p>
                                  )}
                                </div>
                              </div>

                              {/* Kolom Kanan: Data Baru dari Excel */}
                              <div className="border border-indigo-200 rounded-lg p-3.5 bg-indigo-50/40 space-y-2.5">
                                <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                                  <span className="text-xs font-semibold text-indigo-950 flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-indigo-600"></span>
                                    Data Baru dari Excel (Sheet #{conflict.sheet_index})
                                  </span>
                                  <Badge className="bg-indigo-100 text-indigo-800 text-[11px] font-medium hover:bg-indigo-100">
                                    {conflict.imported_data.materials?.length || 0} Item
                                  </Badge>
                                </div>
                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                  {conflict.imported_data.materials?.length ? (
                                    conflict.imported_data.materials.map((m, i) => (
                                      <div
                                        key={i}
                                        className="text-xs p-2.5 rounded-md bg-white border border-indigo-200 shadow-xs flex justify-between items-center gap-3 hover:border-indigo-300 transition-colors"
                                      >
                                        <div className="min-w-0 flex-1">
                                          <div className="font-semibold text-indigo-950 truncate">{m.name}</div>
                                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                            <span className="text-indigo-900">{m.vendor || 'Vendor default'}</span>
                                            <span>•</span>
                                            <span>{m.usage} {m.unit || 'Unit'}</span>
                                            {m.notes && (
                                              <>
                                                <span>•</span>
                                                <span className="text-slate-400 italic truncate max-w-[150px]">{m.notes}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <div className="text-xs font-semibold text-indigo-700">
                                            {formatCurrency(m.harga_ecer || 0)}
                                          </div>
                                          {Boolean(m.harga_roll && m.harga_roll > 0) && (
                                            <div className="text-[10px] text-slate-400">
                                              Roll: {formatCurrency(m.harga_roll)}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-slate-400 italic py-4 text-center">Tidak ada bahan di sheet ini.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          {/* Tab Manufaktur */}
                          <TabsContent value="works" className="pt-2">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* Data Lama Manufaktur */}
                              <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/60 space-y-2.5">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-slate-400"></span>
                                    Data Lama di Database
                                  </span>
                                  <Badge variant="secondary" className="text-[11px] font-medium">
                                    {conflict.previous_data.works?.length || 0} Proses
                                  </Badge>
                                </div>
                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                  {conflict.previous_data.works?.length ? (
                                    conflict.previous_data.works.map((w, i) => (
                                      <div
                                        key={i}
                                        className="text-xs p-2.5 rounded-md bg-white border border-slate-200 shadow-xs flex justify-between items-center gap-3 hover:border-slate-300 transition-colors"
                                      >
                                        <div className="min-w-0 flex-1">
                                          <div className="font-semibold text-slate-900 truncate">{w.work_name}</div>
                                          <div className="text-[11px] text-slate-500 mt-0.5">
                                            {w.vendor_name || 'Vendor default'} • {w.default_usage} {w.default_unit || 'Pcs'}
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <div className="text-xs font-semibold text-slate-900">
                                            {formatCurrency(w.max_estimate || w.min_estimate || 0)}
                                          </div>
                                          {Boolean(w.min_estimate && w.max_estimate && w.min_estimate !== w.max_estimate) && (
                                            <div className="text-[10px] text-slate-400">
                                              Min: {formatCurrency(w.min_estimate)}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-slate-400 italic py-4 text-center">Tidak ada pekerjaan sebelumnya.</p>
                                  )}
                                </div>
                              </div>

                              {/* Data Baru Manufaktur */}
                              <div className="border border-indigo-200 rounded-lg p-3.5 bg-indigo-50/40 space-y-2.5">
                                <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                                  <span className="text-xs font-semibold text-indigo-950 flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-indigo-600"></span>
                                    Data Baru dari Excel (Sheet #{conflict.sheet_index})
                                  </span>
                                  <Badge className="bg-indigo-100 text-indigo-800 text-[11px] font-medium hover:bg-indigo-100">
                                    {conflict.imported_data.works?.length || 0} Proses
                                  </Badge>
                                </div>
                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                  {conflict.imported_data.works?.length ? (
                                    conflict.imported_data.works.map((w, i) => (
                                      <div
                                        key={i}
                                        className="text-xs p-2.5 rounded-md bg-white border border-indigo-200 shadow-xs flex justify-between items-center gap-3 hover:border-indigo-300 transition-colors"
                                      >
                                        <div className="min-w-0 flex-1">
                                          <div className="font-semibold text-indigo-950 truncate">{w.name}</div>
                                          <div className="text-[11px] text-slate-500 mt-0.5">
                                            {w.vendor || 'Vendor default'} • {w.usage} {w.unit || 'Pcs'}
                                          </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <div className="text-xs font-semibold text-indigo-700">
                                            {formatCurrency(w.max_estimate || w.min_estimate || 0)}
                                          </div>
                                          {Boolean(w.min_estimate && w.max_estimate && w.min_estimate !== w.max_estimate) && (
                                            <div className="text-[10px] text-slate-400">
                                              Min: {formatCurrency(w.min_estimate)}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-slate-400 italic py-4 text-center">Tidak ada pekerjaan di sheet ini.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>

                        {/* Action Buttons for this item */}
                        <div className="pt-3 border-t border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-lg">
                          {/* Sisi Kiri: Opsi Keep */}
                          <div>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => handleKeep(conflict)}
                              className="text-xs h-9 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 w-full md:w-auto"
                            >
                              <Check className="size-3.5 mr-1.5 text-emerald-600" />
                              Tetap Seperti Ini (Konfirmasi Pembaruan)
                            </Button>
                          </div>

                          {/* Sisi Kanan: Opsi Separate */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <Input
                              value={getProposedNewName(conflict)}
                              onChange={(e) =>
                                setSeparateNames((prev) => ({
                                  ...prev,
                                  [conflict.id]: e.target.value,
                                }))
                              }
                              placeholder="Nama produk baru..."
                              className="text-xs h-9 w-full sm:w-72 bg-white"
                            />
                            <Button
                              size="sm"
                              disabled={isProcessing}
                              onClick={() => handleSeparate(conflict)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 shrink-0 shadow-xs"
                            >
                              <Split className="size-3.5 mr-1.5" />
                              Pisahkan Jadi Produk Baru
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter className="border-t pt-3 flex items-center justify-between sm:justify-between">
          <span className="text-xs text-slate-500">
            {conflicts.length > 0
              ? 'Tentukan aksi per produk atau gunakan tombol massal di atas.'
              : 'Semua produk telah diproses.'}
          </span>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
