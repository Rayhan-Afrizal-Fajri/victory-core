import { useMemo, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical, ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataTablePagination from './data-table-pagination';
import { multiTokenMatch, getNestedValue } from '@/lib/search';

// --- TYPES ---
export interface DataTableColumn<T> {
  header: string;
  accessor?: keyof T | string;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  searchKeys?: Array<keyof T | string>;
  pageSize?: number;
  emptyText?: string;
  searchPlaceholder?: string;
  enableReorder?: boolean;
  onReorder?: (newOrderedData: T[]) => void;
  storageKey?: string; // Kunci unik jika ingin menyimpan state tertentu (opsional)
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchKeys = [],
  pageSize = 10,
  emptyText = 'No records found.',
  searchPlaceholder,
  enableReorder = false,
  onReorder,
  storageKey,
}: DataTableProps<T>) {
  // Bersihkan legacy shared storageKey ('datatable_state_*') agar tidak ada sisa pencarian lama dari sesi sebelumnya
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('datatable_state_search');
        sessionStorage.removeItem('datatable_state_page');
        sessionStorage.removeItem('datatable_state_sort');
      } catch (e) {
        // Abaikan jika sessionStorage dinonaktifkan di browser
      }
    }
  }, []);

  // 1. Inisialisasi search state secara lokal (tidak menggunakan sessionStorage global agar tidak terbawa ke menu/halaman lain)
  const [search, setSearch] = useState('');

  // 2. Pagination state (hanya menggunakan sessionStorage jika storageKey eksplisit diberikan)
  const [page, setPage] = useState<number>(() => {
    if (!storageKey || typeof window === 'undefined') return 1;
    try {
      const savedPage = sessionStorage.getItem(`${storageKey}_page`);
      return savedPage ? Number(savedPage) : 1;
    } catch {
      return 1;
    }
  });

  // 3. State untuk Sorting (hanya menggunakan sessionStorage jika storageKey eksplisit diberikan)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | string;
    direction: 'asc' | 'desc';
  } | null>(() => {
    if (!storageKey || typeof window === 'undefined') return null;
    try {
      const savedSort = sessionStorage.getItem(`${storageKey}_sort`);
      return savedSort ? JSON.parse(savedSort) : null;
    } catch {
      return null;
    }
  });

  // Simpan perubahan page & sort ke sessionStorage HANYA jika storageKey eksplisit disediakan
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(`${storageKey}_page`, page.toString());
    } catch (e) {}
  }, [page, storageKey]);

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      if (sortConfig) {
        sessionStorage.setItem(`${storageKey}_sort`, JSON.stringify(sortConfig));
      } else {
        sessionStorage.removeItem(`${storageKey}_sort`);
      }
    } catch (e) {}
  }, [sortConfig, storageKey]);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // 2. Proses Search / Filter
  const filteredData = useMemo(() => {
    if (!search.trim() || searchKeys.length === 0) return data;

    return data.filter((item) => {
      const targets = searchKeys.map((key) => {
        if (typeof key === 'string' && key.includes('.')) {
          return getNestedValue(item, key);
        }
        return item[key as keyof T];
      });

      return multiTokenMatch(targets, search);
    });
  }, [data, search, searchKeys]);

  // 3. Proses Sorting
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

        if (Array.isArray(aValue) && Array.isArray(bValue)) {
          return sortConfig.direction === 'asc'
            ? aValue.length - bValue.length
            : bValue.length - aValue.length;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // 4. Proses Pagination
  const pageCount = Math.max(1, Math.ceil(sortedData.length / pageSize));
  
  // Validasi agar page tidak out-of-bound jika data berkurang
  const safePage = Math.min(Math.max(1, page), pageCount);
  const pageIndex = safePage - 1;
  
  const pageData = sortedData.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize,
  );

  // Handler Sorting
  const requestSort = (key: keyof T | string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setPage(1);
  };

  const handleDragEnd = () => {
    if (
      dragItem.current !== null && 
      dragOverItem.current !== null && 
      dragItem.current !== dragOverItem.current
    ) {
      const newData = [...data];
      const dragAbsoluteIndex = pageIndex * pageSize + dragItem.current;
      const dropAbsoluteIndex = pageIndex * pageSize + dragOverItem.current;

      const draggedItemContent = newData.splice(dragAbsoluteIndex, 1)[0];
      newData.splice(dropAbsoluteIndex, 0, draggedItemContent);

      dragItem.current = null;
      dragOverItem.current = null;

      if (onReorder) {
        onReorder(newData);
      }
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
      {/* Toolbar / Search */}
      <div className="border-b border-border/60 p-4 bg-card/50 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1); // Reset ke page 1 saat mengetik pencarian baru
            }}
            placeholder={searchPlaceholder || 'Search...'}
            className="h-9 pl-9 pr-8 w-full"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded cursor-pointer"
              title="Reset pencarian"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-sm">
          <thead className="bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60">
            <tr>
              {enableReorder && <th className="w-10 px-4 py-3"></th>}
              {columns.map((column) => {
                const isSortable = column.sortable !== false && column.accessor;
                return (
                  <th
                    key={column.header}
                    className={cn('px-4 py-3 font-medium whitespace-nowrap', column.className)}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => requestSort(column.accessor!)}
                        className="flex items-center gap-1.5 uppercase tracking-wide hover:text-foreground focus:outline-none text-inherit font-inherit cursor-pointer"
                      >
                        {column.header}
                        {sortConfig?.key === column.accessor ? (
                          sortConfig?.direction === 'asc' ? (
                            <ArrowUp className="size-3.5 text-primary" />
                          ) : (
                            <ArrowDown className="size-3.5 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3.5 text-muted-foreground/60" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={enableReorder ? columns.length + 1 : columns.length}
                  className="px-6 py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              pageData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "border-t border-border/60 bg-card hover:bg-muted/30 transition-colors",
                    enableReorder && "cursor-grab active:cursor-grabbing"
                  )}
                  draggable={enableReorder}
                  onDragStart={() => { if (enableReorder) dragItem.current = rowIndex; }}
                  onDragEnter={() => { if (enableReorder) dragOverItem.current = rowIndex; }}
                  onDragEnd={enableReorder ? handleDragEnd : undefined}
                  onDragOver={(e) => { if (enableReorder) e.preventDefault(); }}
                >
                  {enableReorder && (
                    <td className="w-10 px-4 py-3 text-slate-300 align-middle">
                      <GripVertical className="size-4" />
                    </td>
                  )}

                  {columns.map((column) => (
                    <td
                      key={column.header}
                      className={cn('px-4 py-3 align-middle', column.className)}
                    >
                      {column.cell
                        ? column.cell(row)
                        : String(row[column.accessor as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination dengan Custom Jump-to-Page */}
      <DataTablePagination
        page={safePage}
        pageCount={pageCount}
        total={filteredData.length}
        currentTotal={pageData.length}
        onPageChange={(newPage) => setPage(newPage)}
      />
    </div>
  );
}