import { Moon, Sun, Monitor } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
    const { appearance, resolvedAppearance, updateAppearance } = useAppearance();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'relative size-9 rounded-full text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-foreground active:scale-95',
                        className,
                    )}
                    aria-label="Toggle theme"
                    title={`Theme: ${appearance} (Active: ${resolvedAppearance})`}
                >
                    <Sun className="size-4.5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 text-amber-500/90" />
                    <Moon className="absolute size-4.5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 text-sky-400" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-xl shadow-lg">
                <DropdownMenuItem
                    onClick={() => updateAppearance('light')}
                    className={cn(
                        'cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-2',
                        appearance === 'light' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-accent'
                    )}
                >
                    <Sun className="size-4 text-amber-500" />
                    <span>Terang</span>
                    {appearance === 'light' && <span className="ml-auto text-[10px] text-primary">●</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => updateAppearance('dark')}
                    className={cn(
                        'cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-2',
                        appearance === 'dark' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-accent'
                    )}
                >
                    <Moon className="size-4 text-sky-400" />
                    <span>Gelap</span>
                    {appearance === 'dark' && <span className="ml-auto text-[10px] text-primary">●</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => updateAppearance('system')}
                    className={cn(
                        'cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-2',
                        appearance === 'system' ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-accent'
                    )}
                >
                    <Monitor className="size-4 text-muted-foreground" />
                    <span>Sistem</span>
                    {appearance === 'system' && <span className="ml-auto text-[10px] text-primary">●</span>}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default ThemeToggle;
