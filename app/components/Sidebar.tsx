'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, PlusCircle, Bell, Settings,
  Menu, ChevronLeft, LogOut, Package, Users, UserCircle,
  Sun, Moon, Receipt, PieChart, ChevronRight, Building, TrendingUp, Archive, Truck
} from 'lucide-react';
import { clsx } from 'clsx';
import { RoleSwitcher } from './RoleSwitcher';
import { useRole } from '../contexts/RoleContext';
import { useSidebar } from '../contexts/SidebarContext';
import { handleSignOut } from '../actions/auth';
import { checkLateShipments } from '../utils/notifications';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { useState, useEffect } from 'react';

const navItems = [
  { name: 'Panel', href: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'sales', 'warehouse', 'accountant'] },
  { name: 'Sipariş Ver', href: '/customer/order', icon: PlusCircle, roles: ['customer'] },
  { name: 'Siparişlerim', href: '/sales', icon: Receipt, roles: ['customer'] },
  { name: 'Satış Takip', href: '/sales', icon: Receipt, roles: ['admin', 'manager', 'sales', 'accountant', 'warehouse'] },
  { name: 'Raporlar', href: '/reports', icon: PieChart, roles: ['admin', 'manager', 'accountant'] },
  { name: 'Kullanıcılar', href: '/admin/users', icon: Users, roles: ['admin'] },
  { name: 'Müşteriler', href: '/admin/customers', icon: UserCircle, roles: ['admin'] },
  { name: 'Mağazalar', href: '/admin/stores', icon: Building, roles: ['admin'] },
  { name: 'Hedefler', href: '/admin/targets', icon: TrendingUp, roles: ['admin'] }, // Added Targets
  { name: 'Ürünler', href: '/admin/products', icon: Package, roles: ['admin'] },
  { name: 'Tedarikçiler', href: '/suppliers', icon: Archive, roles: ['admin'] },
  { name: 'Bekleyen Siparişler', href: '/admin/orders', icon: Package, roles: ['admin', 'manager', 'warehouse'] },
  { name: 'Ayarlar', href: '/settings', icon: Settings, roles: ['admin', 'manager', 'sales', 'warehouse', 'accountant', 'customer', 'supplier'] },
  { name: 'Ürünlerim', href: '/supplier/products', icon: Package, roles: ['supplier'] },
  { name: 'Siparişlerim', href: '/supplier/orders', icon: Truck, roles: ['supplier'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role, currentUser, isOriginalAdmin, setRole } = useRole();
  const { theme } = useTheme();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [lateShipmentCount, setLateShipmentCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const check = async () => {
      // 1. Late Shipments
      if (role !== 'customer') {
        const count = await checkLateShipments();
        setLateShipmentCount(count);
      } else {
        setLateShipmentCount(0);
      }

      // 2. Pending Orders Count (For Sidebar Badge)
      if (role === 'admin' || role === 'manager' || role === 'warehouse') {
        import('../actions/notifications').then(({ getPendingOrdersCount }) => {
          getPendingOrdersCount().then(setPendingCount);
        });
      }
    };

    // Initial check
    check();

    // Poll every 60 seconds
    const interval = setInterval(check, 60000);

    return () => clearInterval(interval);
    // Removed pathname from dependencies to prevent re-fetching on navigation
  }, [role]);

  return (
    <aside
      className={clsx(
        "flex flex-col h-screen bg-card border-r border-border transition-all duration-300 ease-in-out z-40",
        // Desktop: Sticky
        "md:sticky md:top-0",
        isCollapsed ? "md:w-20" : "md:w-64",
        // Mobile: Fixed Overlay
        "fixed inset-y-0 left-0 shadow-2xl md:shadow-none",
        isCollapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0 w-64"
      )}
    >
      {/* Logo Area */}
      <div className={clsx("flex items-center gap-3 transition-all duration-300", isCollapsed ? "justify-center h-16" : "justify-start px-6 h-24")}>
        <div className={clsx("relative shrink-0", isCollapsed ? "w-8 h-8" : "w-32 h-16")}>
          <Image
            src="/logo.png"
            alt="Logo"
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
          />
        </div>

      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-4 custom-scrollbar">
        {navItems.map((item) => {
          if (item.roles && !item.roles.includes(role)) return null;

          const Icon = item.icon;
          const isActive = pathname === item.href;

          let badge = null;
          if (item.name === 'Bekleyen Siparişler' && pendingCount > 0) {
            badge = pendingCount;
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-1.5 rounded-lg transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted hover:bg-secondary/50 hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon size={20} className={clsx("shrink-0", isActive ? "text-primary" : "text-muted group-hover:text-foreground")} />
                {badge && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <div className="flex-1 flex justify-between items-center">
                  <span className="whitespace-nowrap transition-opacity duration-300">{item.name}</span>
                  {badge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}

        {/* Role Switcher */}
        {(role === 'admin' || isOriginalAdmin) ? (
          !isCollapsed ? (
            <RoleSwitcher />
          ) : (
            <div className="flex justify-center mt-4">
              <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-xs text-muted" title="Role Demo">
                R
              </div>
            </div>
          )
        ) : null}
      </nav>

      <div className="p-4 border-t border-border space-y-4">
        {/* Bell Icon with Alert Badge */}
        <div className={clsx("flex flex-col items-center gap-4 mb-8", isCollapsed ? "px-2" : "px-4")}>


        </div>



        <div className={clsx("flex items-center gap-2", isCollapsed ? "flex-col justify-center" : "justify-center")}>
          <ThemeToggle />
        </div>
      </div>

      {/* Toggle Button (Desktop) */}
      <button
        onClick={toggleSidebar}
        className="hidden md:flex absolute -right-3 top-20 bg-card border border-border text-muted hover:text-foreground rounded-full p-1 shadow-md hover:bg-secondary transition-colors"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Close Button (Mobile Overlay) */}
      <button
        onClick={toggleSidebar}
        className="md:hidden absolute top-4 right-4 text-muted hover:text-foreground p-2"
      >
        <ChevronLeft size={24} />
      </button>
    </aside>
  );
}
