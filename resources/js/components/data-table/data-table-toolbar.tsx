import { Input } from '@/components/ui/input';

interface DataTableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export default function DataTableToolbar({
  search,
  onSearchChange,
  placeholder = 'Search...',
}: DataTableToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 max-w-sm"
      />
    </div>
  );
}