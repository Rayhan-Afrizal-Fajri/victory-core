import { useMemo, useState  } from 'react';
import type {ReactNode} from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  header: string;
  accessor: keyof T | string;
  cell?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  title?: string;
  description?: string;
  columns: DataTableColumn<T>[];
  data: T[];
  searchKeys: Array<keyof T>;
  pageSize?: number;
  emptyText?: string;
}

export default function DataTable<T extends Record<string, any>>({
  title,
  description,
  columns,
  data,
  searchKeys,
  pageSize = 5,
  emptyText = 'No records found.',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return data;
    }

    return data.filter((item) =>
      searchKeys.some((key) =>
        String(item[key]).toLowerCase().includes(query),
      ),
    );
  }, [data, search, searchKeys]);

  const pageCount = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const pageIndex = Math.min(page - 1, pageCount - 1);
  const pageData = filteredData.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);

  return (
    <Card className="rounded-md w-full">
      <CardHeader className="items-start gap-2 px-4">
        <div>
          {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
        </div>
        <div className="ml-auto flex w-full">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search"
            className="h-8 px-3 text-sm"
          />
        </div>
      </CardHeader>
        <CardContent className="p-4">
            <div className="overflow-hidden rounded-md border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full table-fixed text-sm">
                        <thead
                            className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                            <tr>
                                {columns.map((column) => (
                                <th
                                    key={column.header}
                                    className={cn('px-4 py-3 font-medium whitespace-nowrap', column.className)}>
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
                                    className="px-6 py-8 text-center text-sm text-slate-500">
                                    {emptyText}
                                </td>
                            </tr>
                            ) : ( pageData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-t border-slate-200 last:border-b">
                                {columns.map((column) => (
                                <td
                                    key={column.header}
                                    className={cn('px-4 py-3 align-middle', column.className)}>
                                    {column.cell ? column.cell(row) : String(row[column.accessor as keyof T] ?? '')}
                                </td>
                                ))}
                            </tr>
                            )) )}
                        </tbody>
                    </table>
                </div>
            </div>
        </CardContent>
      <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Showing {pageData.length} of {filteredData.length} entries
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-600">
            Page {page} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => setPage((current) => Math.min(current + 1, pageCount))}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
