import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface SummaryCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    iconClassName?: string;
}

export default function SummaryCard({
    title,
    value,
    icon,
    iconClassName = 'bg-primary/10 text-primary',
}: SummaryCardProps) {
    return (
        <Card className="p-5 rounded-2xl border border-border/70 bg-card shadow-xs transition-all duration-200 hover:shadow-md">
            <div className="flex flex-col items-start justify-between">
                <div className="flex w-full items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {title}
                    </p>
                    <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-200 ${iconClassName}`}
                    >
                        {icon}
                    </div>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {value}
                </p>
            </div>
        </Card>
    );
}
