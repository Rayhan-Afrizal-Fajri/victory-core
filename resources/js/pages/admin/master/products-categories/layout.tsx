import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';
import products from '@/routes/products';
import productCategories from '@/routes/product-categories'; 

const sidebarNavItems: NavItem[] = [
    {
        title: 'Product',
        href: products.index(),
        icon: null,
    },
    {
        title: 'Category',
        href: productCategories.index(),
        icon: null,
    },
];

export default function ProductLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="">
            {/* <Heading
                title="Products & Categories"
                description="Manage your category and product."
            /> */}

            <div className="flex flex-col lg:justify-between lg:flex-row lg:space-x-12 max-2-4xl">
                <aside className="min-w-25 lg:w-48 shrink-0">
                    <nav
                        className="flex flex-col space-y-1 space-x-0"
                        aria-label="Products & Categories"
                    >
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${toUrl(item.href)}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start', {
                                    'bg-muted': isCurrentOrParentUrl(item.href),
                                })}
                            >
                                <Link href={item.href}>
                                    {item.icon && (
                                        <item.icon className="h-4 w-4" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className="flex-1 min-w-0">
                    <section className="w-full">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
