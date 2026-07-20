import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  header: string;
  accessor: keyof T | string; // 'string' mengakomodasi kolom custom
  cell?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean; // <-- Tambahkan ini (opsional)
}