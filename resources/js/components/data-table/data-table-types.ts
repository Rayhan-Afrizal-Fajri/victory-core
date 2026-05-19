import { ReactNode } from 'react';

export interface DataTableColumn<T> {
  header: string;
  accessor: keyof T | string;
  cell?: (row: T) => ReactNode;
  className?: string;
}