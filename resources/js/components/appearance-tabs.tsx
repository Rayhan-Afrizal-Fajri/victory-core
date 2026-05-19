import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    // DARK MODE DISABLED: Show only light mode, no switching available
    // To re-enable dark mode toggle, uncomment the full tabs array below
    // const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
    //     { value: 'light', icon: Sun, label: 'Light' },
    //     { value: 'dark', icon: Moon, label: 'Dark' },
    //     { value: 'system', icon: Monitor, label: 'System' },
    // ];
    
    // Light mode only
    const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: 'light', icon: Sun, label: 'Light' },
    ];

    return (
        <div
            className={cn(
                'inline-flex gap-1 rounded-lg bg-neutral-100 p-1', // Removed 'dark:bg-neutral-800' since dark mode is disabled
                className,
            )}
            {...props}
        >
            {tabs.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    onClick={() => updateAppearance(value)}
                    disabled={true} // DARK MODE DISABLED: Button is disabled
                    className={cn(
                        'flex items-center rounded-md px-3.5 py-1.5 transition-colors cursor-not-allowed opacity-60',
                        appearance === value
                            ? 'bg-white shadow-xs' // Removed dark mode classes
                            : 'text-neutral-500 bg-white shadow-xs', // Light mode always selected
                    )}
                >
                    <Icon className="-ml-1 h-4 w-4" />
                    <span className="ml-1.5 text-sm">{label}</span>
                </button>
            ))}
        </div>
    );
}
