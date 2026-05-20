import type {ReactNode} from 'react';
import ProgressBar from '@/components/dashboard/progress-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface StatusDistributionItem {
  label: string;
  count: number;
  progress: number;
  colorClass: string;
  chipClass: string;
}

interface StatusDistributionProps {
  items: StatusDistributionItem[];
  title?: string;
  description?: string;
  extra?: ReactNode;
}

export default function StatusDistribution({
  items,
  title = 'Distribusi Status',
  description = 'Pesanan per divisi',
  extra,
}: StatusDistributionProps) {
  return (
    <Card className="rounded-md w-full xl:w-3/5">
      <CardHeader className="gap-3 px-6">
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {extra}
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        {items.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex h-2.5 w-2.5 rounded-full ${item.colorClass}`}
              />
              <span className="text-sm font-medium text-slate-700">{item.label}</span>
              <span className="ml-auto text-sm font-semibold text-slate-900">{item.count}</span>
            </div>
            <ProgressBar value={item.progress} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
