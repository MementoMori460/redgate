'use client';

import { useRole } from "../contexts/RoleContext";
import { NotificationCenter } from "./NotificationCenter";
import { usePathname } from 'next/navigation';
import { useSidebar } from '../contexts/SidebarContext';
import { Menu } from 'lucide-react';

export function Topbar() {
    const { currentUser, role } = useRole();
    const pathname = usePathname();
    const { toggleSidebar, isCollapsed } = useSidebar();

    const getPageTitle = () => {
        if (pathname === '/') return 'Genel Bakış';
        if (pathname.includes('/sales')) return 'Satış Takip';
        if (pathname.includes('/reports')) return 'Raporlar';
        if (pathname.includes('/admin/users')) return 'Kullanıcı Yönetimi';
        if (pathname.includes('/admin/customers')) return 'Müşteri Yönetimi';
        if (pathname.includes('/admin/stores')) return 'Mağaza Yönetimi';
        if (pathname.includes('/admin/products')) return 'Ürün Yönetimi';
        if (pathname.includes('/admin/orders')) return 'Siparişler';
        if (pathname.includes('/settings')) return 'Ayarlar';
        return 'Panel';
    };

    return (
        <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="md:hidden p-2 hover:bg-secondary rounded-lg text-muted-foreground"
                >
                    <Menu size={20} />
                </button>
                {(pathname === '/' || (pathname.includes('/sales') && !pathname.includes('/edit'))) && (role === 'admin' || role === 'sales' || role === 'manager') ? (
                    <AddSaleButton />
                ) : (
                    <h1 className="text-xl font-bold tracking-tight hidden md:block">{getPageTitle()}</h1>
                )}
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                    <p className="text-sm font-medium">{currentUser || 'Kullanıcı'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{role === 'sales' ? 'Plasiyer' : role}</p>
                </div>

                {pathname.includes('/reports') && (
                    <UpdateDataButton />
                )}

                <div className="w-px h-8 bg-border/50 hidden md:block" />

                <NotificationCenter />
            </div>
        </header >
    );
}

import { refreshReportCache } from '@/app/actions/reports';
import { useTransition } from 'react';
import { RotateCcw, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

function UpdateDataButton() {
    const [isPending, startTransition] = useTransition();

    const handleUpdate = () => {
        startTransition(async () => {
            await refreshReportCache();
        });
    };

    return (
        <button
            onClick={handleUpdate}
            disabled={isPending}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-medium transition-colors"
        >
            <RotateCcw size={14} className={isPending ? "animate-spin" : ""} />
            {isPending ? 'Güncelleniyor...' : 'Verileri Güncelle'}
        </button>
    );
}

function AddSaleButton() {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <button
            onClick={() => router.push('/sales/add')}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-medium transition-colors shadow-sm shadow-primary/20"
        >
            <Plus size={14} />
            Satış Ekle
        </button>
    )
}
