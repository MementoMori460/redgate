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
                <h1 className="text-xl font-bold tracking-tight hidden md:block">{getPageTitle()}</h1>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                    <p className="text-sm font-medium">{currentUser || 'Kullanıcı'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{role === 'sales' ? 'Plasiyer' : role}</p>
                </div>

                <div className="w-px h-8 bg-border/50 hidden md:block" />

                <NotificationCenter />
            </div>
        </header>
    );
}
