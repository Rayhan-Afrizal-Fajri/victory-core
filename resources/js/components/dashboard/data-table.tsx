import { useMemo, useState  } from 'react';
import type {ReactNode} from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { multiTokenMatch, getNestedValue } from '@/lib/search';

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
  searchKeys: Array<keyof T | string>;
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
    if (!search.trim() || !searchKeys || searchKeys.length === 0) {
      return data;
    }

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

  const pageCount = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const pageIndex = Math.min(page - 1, pageCount - 1);
  const pageData = filteredData.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);

  return (
    <Card className="rounded-2xl border border-border/70 bg-card shadow-xs w-full h-fit">
      <CardHeader className="items-start gap-2 px-6 pt-6 pb-2">
        <div>
          {title && <CardTitle className="text-base font-bold text-foreground sm:text-lg">{title}</CardTitle>}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <div className="ml-auto flex w-full max-w-xs">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search..."
            className="h-8.5 px-3 text-xs rounded-xl"
          />
        </div>
      </CardHeader>
        <CardContent className="p-6 pt-2">
            <div className="overflow-hidden rounded-xl border border-border/60">
                <div className="overflow-x-auto">
                    <table className="min-w-full table-fixed text-sm">
                        <thead
                            className="bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60">
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
                                    className="px-6 py-8 text-center text-sm text-muted-foreground">
                                    {emptyText}
                                </td>
                            </tr>
                            ) : ( pageData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-t border-border/60 bg-card hover:bg-muted/30 transition-colors">
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
      <div className="flex flex-col gap-4 border-t border-border/60 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between bg-card/30">
        <p className="text-xs text-muted-foreground">
          Showing {pageData.length} of {filteredData.length} entries
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-8 rounded-lg"
          >
            Prev
          </Button>
          <span className="text-xs text-muted-foreground px-2">
            {page} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            className="h-8 rounded-lg"
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
