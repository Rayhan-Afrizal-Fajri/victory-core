import type { ReactNode } from 'react';
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
    <Card className="rounded-2xl border border-border/70 bg-card shadow-xs w-full xl:w-3/5">
      <CardHeader className="gap-2 px-6 pt-6 pb-2">
        <div>
          <CardTitle className="text-base font-bold text-foreground sm:text-lg">{title}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">{description}</CardDescription>
        </div>
        {extra}
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6 pt-2">
        {items.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex h-2.5 w-2.5 rounded-full ${item.colorClass}`}
              />
              <span className="text-sm font-medium text-foreground/80">{item.label}</span>
              <span className="ml-auto text-sm font-bold text-foreground">{item.count}</span>
            </div>
            <ProgressBar value={item.progress} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
