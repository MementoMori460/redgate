'use client';

import { useState } from 'react';
import { useRole, UserRole } from '../contexts/RoleContext';
import { Shield, Users, Package, UserCog, ChevronDown, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export function RoleSwitcher() {
    const { role, setRole } = useRole();
    const [isOpen, setIsOpen] = useState(false);

    const roles: { id: UserRole; label: string; icon: React.ElementType }[] = [
        { id: 'admin', label: 'Yönetici / Müdür', icon: Shield },
        { id: 'sales', label: 'Satış Personeli', icon: Users },
        { id: 'warehouse', label: 'Depo Sorumlusu', icon: Package },
        { id: 'accountant', label: 'Muhasebeci', icon: UserCog },
        { id: 'customer', label: 'Müşteri (Demo)', icon: Users },
    ];

    return (
        <div className="px-4 py-0 mt-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between text-xs font-semibold text-muted uppercase tracking-wider mb-0 px-2 py-2 hover:text-foreground transition-colors group"
            >
                <span>Görünüm (Demo)</span>
                {isOpen ? <ChevronDown size={14} className="text-muted group-hover:text-foreground" /> : <ChevronRight size={14} className="text-muted group-hover:text-foreground" />}
            </button>

            {isOpen && (
                <div className="space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                    {roles.map((r) => {
                        const Icon = r.icon;
                        const isActive = role === r.id;
                        return (
                            <button
                                key={r.id}
                                onClick={() => setRole(r.id)}
                                className={clsx(
                                    "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                                    isActive
                                        ? "bg-primary text-white shadow-md shadow-primary/20"
                                        : "text-muted hover:bg-secondary/50 hover:text-foreground"
                                )}
                            >
                                <Icon size={16} />
                                {r.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
