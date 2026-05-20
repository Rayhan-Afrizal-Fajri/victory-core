import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

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
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchKeys = [],
  pageSize = 10,
  emptyText = 'No records found.',
  searchPlaceholder,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query || searchKeys.length === 0) {
      return data;
    }

    return data.filter((item) =>
      searchKeys.some((key) =>
        String(item[key] ?? '')
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [data, search, searchKeys]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredData.length / pageSize),
  );

  const pageIndex = Math.min(page - 1, pageCount - 1);

  const pageData = filteredData.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize,
  );

  return (
    <div className="overflow-hidden rounded-sm border border-slate-200 bg-white">
      {/* TOOLBAR */}
      <div className="border-b border-slate-200 p-4">
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
              {columns.map((column) => (
                <th
                  key={column.header}
                  className={cn(
                    'px-4 py-3 font-medium whitespace-nowrap',
                    column.className,
                  )}
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
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-sm text-slate-500"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              pageData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-t border-slate-200"
                >
                  {columns.map((column) => (
                    <td
                      key={column.header}
                      className={cn(
                        'px-4 py-3 align-middle',
                        column.className,
                      )}
                    >
                      {column.cell
                        ? column.cell(row)
                        : String(
                            row[column.accessor as keyof T] ?? '',
                          )}
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
        onPrev={() =>
          setPage((prev) => Math.max(prev - 1, 1))
        }
        onNext={() =>
          setPage((prev) =>
            Math.min(prev + 1, pageCount),
          )
        }
      />
    </div>
  );
}