import { useMemo, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical, ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DataTablePagination from './data-table-pagination';

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
  searchKeys?: Array<keyof T>;
  pageSize?: number;
  emptyText?: string;
  searchPlaceholder?: string;
  enableReorder?: boolean;
  onReorder?: (newOrderedData: T[]) => void;
  storageKey?: string; // Kunci unik untuk menyimpan state di sessionStorage
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
  storageKey = 'datatable_state',
}: DataTableProps<T>) {
  // 1. Inisialisasi state dengan membaca sessionStorage agar posisi halaman/search tidak hilang saat refresh
  const [search, setSearch] = useState(() => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(`${storageKey}_search`) || '';
  });

  const [page, setPage] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const savedPage = sessionStorage.getItem(`${storageKey}_page`);
    return savedPage ? Number(savedPage) : 1;
  });

  // --- State untuk Sorting ---
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | string;
    direction: 'asc' | 'desc';
  } | null>(() => {
    if (typeof window === 'undefined') return null;
    const savedSort = sessionStorage.getItem(`${storageKey}_sort`);
    return savedSort ? JSON.parse(savedSort) : null;
  });

  // Simpan perubahan page & search ke sessionStorage supaya survive saat refresh/Inertia reload
  useEffect(() => {
    sessionStorage.setItem(`${storageKey}_search`, search);
  }, [search, storageKey]);

  useEffect(() => {
    sessionStorage.setItem(`${storageKey}_page`, page.toString());
  }, [page, storageKey]);

  useEffect(() => {
    if (sortConfig) {
      sessionStorage.setItem(`${storageKey}_sort`, JSON.stringify(sortConfig));
    } else {
      sessionStorage.removeItem(`${storageKey}_sort`);
    }
  }, [sortConfig, storageKey]);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // 2. Proses Search / Filter
  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query || searchKeys.length === 0) return data;

    return data.filter((item) =>
      searchKeys.some((key) =>
        String(item[key] ?? '')
          .toLowerCase()
          .includes(query),
      ),
    );
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
    <div className="overflow-hidden rounded-sm border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
      {/* Toolbar / Search */}
      <div className="border-b border-slate-200 p-4 dark:border-slate-700 flex items-center justify-between gap-4">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1); // Reset ke page 1 saat mengetik pencarian baru
          }}
          placeholder={searchPlaceholder || 'Search...'}
          className="h-9 max-w-sm"
        />
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
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
                        className="flex items-center gap-1.5 uppercase tracking-wide hover:text-slate-800 focus:outline-none text-inherit font-inherit"
                      >
                        {column.header}
                        {sortConfig?.key === column.accessor ? (
                          sortConfig?.direction === 'asc' ? (
                            <ArrowUp className="size-3.5" />
                          ) : (
                            <ArrowDown className="size-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3.5 text-slate-300" />
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
                  className="px-6 py-10 text-center text-sm text-slate-500"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              pageData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "border-t border-slate-200 bg-white",
                    enableReorder && "cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-colors"
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