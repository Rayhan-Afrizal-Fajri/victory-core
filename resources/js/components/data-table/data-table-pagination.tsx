import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from '../ui/select';
import { Input } from '../ui/input';

interface DataTablePaginationProps {
  page: number;
  pageCount: number;
  total: number;
  currentTotal: number;
  onPageChange: (page: number) => void;
}

export default function DataTablePagination({
  page,
  pageCount,
  total,
  currentTotal,
  onPageChange,
}: DataTablePaginationProps) {
  return (
    <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing {currentTotal} of {total} entries
      </p>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-4 mr-1" /> Previous
        </Button>

        {/* Custom Page Selector / Dropdown Lompat Halaman */}
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <span>Page</span>
          <Select
            value={page.toString()}
            onValueChange={(val) => onPageChange(Number(val))}
          >
            <SelectTrigger className="h-8 w-17.5 text-xs">
              <SelectValue placeholder={page} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((pageNum) => (
                <SelectItem key={pageNum} value={pageNum.toString()}>
                  {pageNum}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>of {pageCount}</span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}