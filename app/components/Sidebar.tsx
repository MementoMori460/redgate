'use client';

import Link from 'next/link';
import Image from 'next/image'; // Kept as it's used in the component
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, PlusCircle, Bell, Settings,
  Menu, ChevronLeft, LogOut, Package, Users,
  Sun, Moon, Receipt, PieChart, ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { RoleSwitcher } from './RoleSwitcher'; // Kept as it's used in the component
import { useRole } from '../contexts/RoleContext';
import { useSidebar } from '../contexts/SidebarContext'; // Kept as it's used in the component
import { handleSignOut } from '../actions/auth';
import { checkLateShipments } from '../utils/notifications';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { useState, useEffect } from 'react'; // Added from the instruction's implied change

const navItems = [
  { name: 'Panel', href: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'sales', 'warehouse', 'accountant'] },
  { name: 'Sipariş Ver', href: '/customer/order', icon: PlusCircle, roles: ['customer'] },
  { name: 'Siparişlerim', href: '/sales', icon: Receipt, roles: ['customer'] },
  { name: 'Satış Takip', href: '/sales', icon: Receipt, roles: ['admin', 'manager', 'sales', 'accountant', 'warehouse'] },
  { name: 'Raporlar', href: '/reports', icon: PieChart, roles: ['admin', 'manager', 'accountant'] },
  { name: 'Kullanıcılar', href: '/admin/users', icon: Users, roles: ['admin'] },
  { name: 'Müşteriler', href: '/admin/customers', icon: Users, roles: ['admin'] },
  { name: 'Ürünler', href: '/admin/products', icon: Package, roles: ['admin'] },
  { name: 'Bekleyen Siparişler', href: '/admin/orders', icon: Package, roles: ['admin', 'manager', 'warehouse'] },
  { name: 'Ayarlar', href: '/settings', icon: Settings, roles: ['admin', 'manager', 'sales', 'warehouse', 'accountant', 'customer'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { role, currentUser, isOriginalAdmin, setRole } = useRole();
  const { theme } = useTheme();
  const { isCollapsed, toggleSidebar } = useSidebar(); // Use context
  const [lateShipmentCount, setLateShipmentCount] = useState(0);

  useEffect(() => {
    // Check for late shipments
    const check = async () => {
      const count = await checkLateShipments();
      setLateShipmentCount(count);
    };
    check();
  }, []);

  // Removed local toggleSidebar function since we use the one from context


  return (
    <aside
      className={clsx(
        "bg-card border-r border-border h-screen fixed left-0 top-0 hidden md:flex flex-col transition-all duration-300 ease-in-out z-20",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-2 border-b border-border flex flex-col items-center relative">
        <div className={clsx("relative transition-all duration-300", isCollapsed ? "w-10 h-10" : "w-full h-12")}>
          <Image
            src="/logo.png"
            alt="Redgate Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

      </div>

      <nav className="flex-1 p-2 space-y-0.5 mt-2">
        {navItems.map((item) => {
          if (item.roles && !item.roles.includes(role)) return null;

          const Icon = item.icon;
          const isActive = pathname === item.href;

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
              <Icon size={20} className={clsx("shrink-0", isActive ? "text-primary" : "text-muted group-hover:text-foreground")} />
              {!isCollapsed && <span className="whitespace-nowrap transition-opacity duration-300">{item.name}</span>}
            </Link>
          );
        })}

        <div className="my-4 border-t border-border/50" />

        {/* Role Switcher - Compact Mode - Only for Admins */}
        {(role === 'admin' || isOriginalAdmin) ? (
          !isCollapsed ? (
            <RoleSwitcher />
          ) : (
            <div className="flex justify-center">
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
          <div className="relative">
            <div className="p-2 bg-secondary rounded-lg text-foreground">
              <Bell size={20} />
            </div>
            {lateShipmentCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {lateShipmentCount}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <div className="text-center">
              {lateShipmentCount > 0 ? (
                <p className="text-xs font-bold text-red-500 animate-pulse">{lateShipmentCount} Gecikmiş Kargo!</p>
              ) : (
                <p className="text-xs text-muted-foreground">Bildirim Yok</p>
              )}
            </div>
          )}
        </div>

        {isCollapsed ? (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-xs font-bold text-white cursor-help" title={currentUser}>
              {currentUser?.substring(0, 2).toUpperCase() || 'TR'}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-xs font-bold text-white shrink-0">
              {currentUser?.substring(0, 2).toUpperCase() || 'TR'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{role === 'sales' ? currentUser : currentUser || 'Kullanıcı'}</p>
              <p className="text-xs text-muted capitalize truncate">
                {role === 'admin' && 'Yönetici'}
                {role === 'manager' && 'Müdür'}
                {role === 'sales' && 'Satış Tem.'}
                {role === 'warehouse' && 'Depo Sor.'}
                {role === 'accountant' && 'Muhasebeci'}
              </p>
            </div>
          </div>
        )}

        <div className={clsx("flex items-center gap-2", isCollapsed ? "flex-col justify-center" : "justify-center")}>
          <ThemeToggle />
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 bg-card border border-border text-muted hover:text-foreground rounded-full p-1 shadow-md hover:bg-secondary transition-colors"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
