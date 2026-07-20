import { useMemo, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';

import DataTablePagination from './data-table-pagination';
import DataTableToolbar from './data-table-toolbar';

import type { DataTableColumn } from './data-table-types';

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  searchKeys?: Array<keyof T>;
  pageSize?: number;
  emptyText?: string;
  searchPlaceholder?: string;
  enableReorder?: boolean;
  onReorder?: (newOrderedData: T[]) => void;
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
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // --- State untuk Sorting ---
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // 1. Proses Search / Filter
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

  // 2. Proses Sorting
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Penanganan jika value null/undefined
        if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

        // Penanganan khusus jika data berupa Array (misal: materials) -> sort berdasarkan jumlah item
        if (Array.isArray(aValue) && Array.isArray(bValue)) {
          return sortConfig.direction === 'asc'
            ? aValue.length - bValue.length
            : bValue.length - aValue.length;
        }

        // Default sorting untuk String atau Number
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

  // 3. Proses Pagination
  const pageCount = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const pageIndex = Math.min(page - 1, pageCount - 1);
  const pageData = sortedData.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize,
  );

  // Handler Sorting
  const requestSort = (key: keyof T | string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    // Jika kolom yang sama di-klik, balik arah sorting
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
    setPage(1); // Reset ke halaman 1 tiap kali melakukan sorting
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
      <div className="border-b border-slate-200 p-4 dark:border-slate-700">
        <DataTableToolbar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder={searchPlaceholder}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              {enableReorder && <th className="w-10 px-4 py-3"></th>}
              
              {columns.map((column) => {
                // Tentukan apakah kolom ini bisa di-sort (default: true jika ada accessor)
                const isSortable = column.sortable !== false && column.accessor;
                
                return (
                  <th
                    key={column.header}
                    className={cn('px-4 py-3 font-medium whitespace-nowrap', column.className)}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => requestSort(column.accessor)}
                        className="flex items-center gap-1.5 uppercase tracking-wide hover:text-slate-800 focus:outline-none text-inherit font-inherit"
                      >
                        {column.header}
                        
                        {/* Render Icon Sorting */}
                        {sortConfig?.key === column.accessor ? (
                          sortConfig.direction === 'asc' ? (
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

      <DataTablePagination
        page={page}
        pageCount={pageCount}
        total={filteredData.length}
        currentTotal={pageData.length}
        onPrev={() => setPage((prev) => Math.max(prev - 1, 1))}
        onNext={() => setPage((prev) => Math.min(prev + 1, pageCount))}
      />
    </div>
  );
}