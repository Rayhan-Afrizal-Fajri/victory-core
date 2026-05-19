import type {ReactNode}
from 'react';
import {Card} from '@/components/ui/card';

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
    iconClassName = 'bg-slate-100 text-slate-900'
} : SummaryCardProps) {
    return (
        <Card className="p-4">
            <div className="flex flex-col items-start justify-between">
                <div className='w-full flex items-center justify-between'>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                        {title}
                    </p>
                    <div
                        className={`flex h-8 w-8 items-center justify-center rounded-sm ${iconClassName}`}>
                        {icon}
                    </div>
                </div>
                <p className="mt-4 text-[24px] font-semibold text-slate-900">{value}</p>
            </div>
        </Card>
    );
}
