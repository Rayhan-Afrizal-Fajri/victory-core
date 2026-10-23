import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  const [inputVal, setInputVal] = useState<string>(page.toString());

  // Sinkronkan inputVal saat prop page berubah dari luar
  useEffect(() => {
    setInputVal(page.toString());
  }, [page]);

  const commitPageChange = () => {
    const parsed = parseInt(inputVal, 10);
    if (isNaN(parsed)) {
      setInputVal(page.toString());
      return;
    }

    // Batasi nilai agar tetap di rentang 1 s.d. pageCount
    const clamped = Math.max(1, Math.min(parsed, pageCount));
    setInputVal(clamped.toString());

    if (clamped !== page) {
      onPageChange(clamped);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitPageChange();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setInputVal(page.toString());
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = parseInt(inputVal, 10) || page;
      if (current < pageCount) {
        const next = current + 1;
        setInputVal(next.toString());
        onPageChange(next);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = parseInt(inputVal, 10) || page;
      if (current > 1) {
        const prev = current - 1;
        setInputVal(prev.toString());
        onPageChange(prev);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 border-t border-border/60 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between bg-card/30">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{currentTotal}</span> of{' '}
        <span className="font-semibold text-foreground">{total}</span> entries
      </p>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 rounded-lg"
        >
          <ChevronLeft className="size-4 mr-1" /> Previous
        </Button>

        {/* Interactive Page Input */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Page</span>
          <div className="relative">
            <Input
              type="number"
              min={1}
              max={pageCount}
              value={inputVal}
              disabled={pageCount <= 1}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setInputVal(e.target.value)}
              onBlur={commitPageChange}
              onKeyDown={handleKeyDown}
              className="h-8 w-14 rounded-lg text-center text-xs font-semibold px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              title={`Ketik nomor halaman (1-${pageCount}) lalu tekan Enter`}
            />
          </div>
          <span>of {pageCount}</span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className="h-8 rounded-lg"
        >
          Next <ChevronRight className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}