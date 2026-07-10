import { Link, usePage } from '@inertiajs/react';
import { BookOpen, ClipboardList, ClipboardPlus, CreditCard, FolderGit2, LayoutGrid, Package, ShoppingCart, SquareKanban, TrendingUp, UsersRound, Workflow } from 'lucide-react';
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
import type { NavItem, NavItemProps } from '@/types';
import type { RouteDefinition } from '@/wayfinder';
import { SidebarDropdown, SidebarDropdownProvider } from './sidebar-dropdown';
import products from '@/routes/products';
import materials from '@/routes/materials';
import manufacturingWorks from '@/routes/manufacturing-works';
import sizeBreakdowns from '@/routes/size-breakdowns';
import { useCan } from '@/hooks/use-can';



export function AppSidebar() {
    const can = useCan();

    const generalWorkspace: NavItem[] = [
        ...(can('dashboard.view') || can('dashboard.admin') ? [{
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        }] : []),
        ...(can('kanban.view') ? [{
            title: 'Kanban Board',
            href: kanbanBoard.index(),
            icon: SquareKanban,
        }] : []),
        ...(can('worker.view') ? [{
            title: 'Worker Board',
            href: '/production-runs/board',
            icon: Workflow,
        },] : []),
    ];
    
    let salesWorkspace: NavItem[] = [];

    if (can('order_entry.view')) {
        salesWorkspace.push({
            title: 'Order Entry',
            href: orderEntry.index(),
            icon: ClipboardPlus,
        })
    }
    
    if (can('invoices.view')) {
        salesWorkspace.push({
            title: 'Invoice & Payments',
            href: invoices.index(),
            icon: CreditCard,
        });
    }
    
    const operationWorkspace: NavItem[] = [];

    if (can('purchasings.view')) {
        operationWorkspace.push({
            title: 'Purchasing',
            href: purchasings.index(),
            icon: ShoppingCart,
        });
    }
    if (can('job_tickets.view')) {
        operationWorkspace.push({
            title: 'Purchase Orders',
            href: jobTickets.index(),
            icon: ClipboardList,
        });
    }
    
    const reportWorkspace: NavItem[] = [
        ...(can('report.view') ? [{
            title: 'P&L Report',
            href: profitLossReport.index(),
            icon: TrendingUp,
        }] : []),
    ]

    const page = usePage();
    
    const masterItems = [
        ...(can('users.view') || can('roles.view') ? [{
            label: 'Users',
            href: users.index(),
        },] : []),
        ...(can('customers.view') ? [{
            label: 'Customers',
            href: customers.index(),
        }] : []),
        ...(can('suppliers.view') ? [{
            label: 'Suppliers',
            href: suppliers.index(),
        }] : []),
        ...(can('companies.view') ? [{
            label: 'Company Profiles',
            href: '/company-profiles',
        }] : []),
        ...(can('sizes.view') ? [{
            label: 'Size Breakdowns',
            href: sizeBreakdowns.index(),
        }] : []),
        ...(can('products.view') ? [{
            label: 'Products',
            href: products.index(),
        }] : []),
        ...(can('materials.view') ? [{
            label: 'Bahan',
            href: materials.index(),
        }] : []),
        ...(can('manufactures.view') ? [{
            label: 'Manufaktur',
            href: manufacturingWorks.index(),
        }] : [])
    ];

    const masterLinks: { label: string; href: string | RouteDefinition<"get"> }[] = masterItems
        .map(({ label, href }) => ({ label, href }));
    const showMasterDropdown = masterLinks.length > 0;
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
                {salesWorkspace.length !== 0 && (
                    <NavMain items={salesWorkspace} title="Pra-Produksi & Sales" />
                )}
                {operationWorkspace.length !== 0 && (
                    <NavMain items={operationWorkspace} title="Workspace & Logistik" />
                )}
                {can('report.view') && (
                    <NavMain items={reportWorkspace} title="Laporan" />
                )}

                {masterLinks.length > 0 && (
                    <>
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
                </>
                )}
            </SidebarContent>

            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
