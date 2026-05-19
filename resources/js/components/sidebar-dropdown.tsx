import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import React, { useContext, useState } from 'react';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { RouteDefinition } from '@/wayfinder';

interface NavItemProps {
    label: string;
    href: RouteDefinition<"get">;
    icon?: React.ComponentType<{ className?: string }>;
}

interface SidebarDropdownProps {
    /** Section title */
    title: string;
    /** Optional unique key identifying this dropdown; defaults to title. */
    sectionKey?: string;
    /** Icon component for the section header */
    icon?: React.ComponentType<{ className?: string }>;
    /** Array of navigation items */
    items: NavItemProps[];
}

// context used to coordinate expanded state between multiple dropdowns
const SidebarDropdownContext =
    React.createContext<{
        openKey: string | null;
        setOpenKey: (k: string | null) => void;
    }>({
        openKey: null,
        setOpenKey: () => {},
    });

export function SidebarDropdownProvider({
    children,
}: React.PropsWithChildren<unknown>) {
    const [openKey, setOpenKey] = useState<string | null>(null);
    return (
        <SidebarDropdownContext.Provider value={{ openKey, setOpenKey }}>
            {children}
        </SidebarDropdownContext.Provider>
    );
}

export function SidebarDropdown({
    title,
    sectionKey,
    icon: Icon,
    items,
}: SidebarDropdownProps) {
    const { isCurrentUrl } = useCurrentUrl();
    const isAnyActive = items.some((item) => isCurrentUrl(item.href));
    const { openKey, setOpenKey } = useContext(SidebarDropdownContext);
    const key = sectionKey ?? title;

    // expanded solely controlled by context key (manual toggling)
    const expanded = openKey === key;

    const handleToggle = () => {
        if (expanded) {
            setOpenKey(null);
        } else {
            setOpenKey(key);
        }
    };

    return (
        <div className="mt-2 px-2">
            <SidebarMenuButton
                onClick={handleToggle}
                isActive={isAnyActive}
                className="w-full py-5 text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-foreground/5"
            >
                {Icon && <Icon className="h-5 w-5" />}
                <span>{title}</span>
                <ChevronRight
                    className={`ml-auto h-4 w-4 transition-transform ${
                        expanded ? 'rotate-90' : ''
                    }`}
                />
            </SidebarMenuButton>

            {expanded && (
                <div className="mt-1 ml-4 space-y-1">
                    {items.map((item) => {
                        const ItemIcon = item.icon;
                        const active = isCurrentUrl(item.href);

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                prefetch
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                    active
                                        ? 'text-sidebar-primary'
                                        : 'text-sidebar-foreground/50 hover:text-sidebar-foreground dark:text-sidebar-foreground dark:hover:bg-sidebar-accent'
                                }`}
                            >
                                {ItemIcon && <ItemIcon className="h-4 w-4" />}
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
