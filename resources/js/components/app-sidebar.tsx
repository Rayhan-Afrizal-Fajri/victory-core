import { Link } from '@inertiajs/react';
import { BookOpen, ClipboardList, ClipboardPlus, CreditCard, FolderGit2, LayoutGrid, Package, ShoppingCart, SquareKanban, TrendingUp, UsersRound } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import customers from '@/routes/customers';
import invoices from '@/routes/invoices';
import jobTickets from '@/routes/job-tickets';
import kanbanBoard from '@/routes/kanban-board';
import orderEntry from '@/routes/order-entry';
import profitLossReport from '@/routes/profit-loss-report';
import purchasings from '@/routes/purchasings';
import suppliers from '@/routes/suppliers';
import users from '@/routes/users';
import type { NavItem } from '@/types';
import type { RouteDefinition } from '@/wayfinder';
import { SidebarDropdown, SidebarDropdownProvider } from './sidebar-dropdown';
import products from '@/routes/products';
import materials from '@/routes/materials';
import manufacturingWorks from '@/routes/manufacturing-works';


const generalWorkspace: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Kanban Board',
        href: kanbanBoard.index(),
        icon: SquareKanban,
    },
];

const salesWorkspace: NavItem[] = [
    {
        title: 'Order Entry',
        href: orderEntry.index(),
        icon: ClipboardPlus,
    },
    {
        title: 'Invoice & Payments',
        href: invoices.index(),
        icon: CreditCard,
    },
];

const operationWorkspace: NavItem[] = [
    {
        title: 'Purchasing',
        href: purchasings.index(),
        icon: ShoppingCart,
    },
    {
        title: 'Job Tickets',
        href: jobTickets.index(),
        icon: ClipboardList,
    },
];

const reportWorkspace: NavItem[] = [
    {
        title: 'P&L Report',
        href: profitLossReport.index(),
        icon: TrendingUp,
    },
]

const masterItems = [
    {
        label: 'Users',
        href: users.index(),
    },
    {
        label: 'Customers',
        href: customers.index(),
    },
    {
        label: 'Suppliers',
        href: suppliers.index(),
    },
    {
        label: 'Products',
        href: products.index(),
    },
    {
        label: 'Bahan',
        href: materials.index(),
    },
    {
        label: 'Manufaktur',
        href: manufacturingWorks.index(),
    },
];

const masterLinks: { label: string; href: RouteDefinition<"get"> }[] = masterItems
    .map(({ label, href }) => ({ label, href }));
const showMasterDropdown = masterLinks.length > 0;

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>

                <NavMain items={generalWorkspace} title="Utama" />
                <NavMain items={salesWorkspace} title="Pra-Produksi & Sales" />
                <NavMain items={operationWorkspace} title="Workspace & Logistik" />
                <NavMain items={reportWorkspace} title="Laporan" />

                <div className="mt-4 px-3 text-xs font-semibold text-sidebar-foreground/50 opacity-100 group-data-[collapsible=icon]:hidden">
                    Pengaturan
                </div>
                <SidebarDropdownProvider>
                    {showMasterDropdown && (
                        <SidebarDropdown
                        sectionKey="master"
                        title="Master Data"
                        icon={Package}
                        items={masterLinks}
                        />
                    )}
                </SidebarDropdownProvider>
            </SidebarContent>

            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
