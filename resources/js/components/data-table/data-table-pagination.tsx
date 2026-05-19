import { Button } from '@/components/ui/button';

interface DataTablePaginationProps {
  page: number;
  pageCount: number;
  total: number;
  currentTotal: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function DataTablePagination({
  page,
  pageCount,
  total,
  currentTotal,
  onPrev,
  onNext,
}: DataTablePaginationProps) {
  return (
    <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing {currentTotal} of {total} entries
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={onPrev}
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
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}