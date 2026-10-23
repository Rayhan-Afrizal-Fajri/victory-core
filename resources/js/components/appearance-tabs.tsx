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

    const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: 'light', icon: Sun, label: 'Light' },
        { value: 'dark', icon: Moon, label: 'Dark' },
        { value: 'system', icon: Monitor, label: 'System' },
    ];

    return (
        <div
            className={cn(
                'inline-flex items-center gap-1 rounded-xl bg-muted/80 p-1 border border-border/50 backdrop-blur-sm shadow-xs',
                className,
            )}
            role="radiogroup"
            aria-label="Appearance options"
            {...props}
        >
            {tabs.map(({ value, icon: Icon, label }) => {
                const isActive = appearance === value;
                return (
                    <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => updateAppearance(value)}
                        className={cn(
                            'group relative flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all duration-200 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]',
                            isActive
                                ? 'bg-card text-foreground font-semibold shadow-xs'
                                : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
                        )}
                    >
                        <Icon
                            className={cn(
                                'size-4 transition-transform duration-200 group-hover:scale-110',
                                isActive && value === 'light' && 'text-amber-500',
                                isActive && value === 'dark' && 'text-sky-400',
                                isActive && value === 'system' && 'text-primary',
                            )}
                        />
                        <span>{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
