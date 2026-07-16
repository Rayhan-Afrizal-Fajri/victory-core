import { useMemo, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react'; // Tambahkan icon Grip

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
  // --- Props baru untuk fitur Reorder ---
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
  enableReorder = false, // Default false agar view lain tidak terdampak
  onReorder,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Refs untuk Drag & Drop
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

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

  const pageCount = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const pageIndex = Math.min(page - 1, pageCount - 1);
  const pageData = filteredData.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize,
  );

  // Handler Drag & Drop
  const handleDragEnd = () => {
    if (
      dragItem.current !== null && 
      dragOverItem.current !== null && 
      dragItem.current !== dragOverItem.current
    ) {
      const newData = [...data];
      
      // Kalkulasi index absolut (mengakomodasi jika ada pagination)
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
      {/* TOOLBAR */}
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

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              {/* Tambahan kolom header kosong khusus Grip icon jika reorder aktif */}
              {enableReorder && <th className="w-10 px-4 py-3"></th>}
              
              {columns.map((column) => (
                <th
                  key={column.header}
                  className={cn('px-4 py-3 font-medium whitespace-nowrap', column.className)}
                >
                  {column.header}
                </th>
              ))}
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
                  // Atribut HTML5 Drag & Drop aktif jika enableReorder = true
                  draggable={enableReorder}
                  onDragStart={() => { if (enableReorder) dragItem.current = rowIndex; }}
                  onDragEnter={() => { if (enableReorder) dragOverItem.current = rowIndex; }}
                  onDragEnd={enableReorder ? handleDragEnd : undefined}
                  onDragOver={(e) => { if (enableReorder) e.preventDefault(); }}
                >
                  {/* Kolom Grip Icon */}
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

      {/* PAGINATION */}
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