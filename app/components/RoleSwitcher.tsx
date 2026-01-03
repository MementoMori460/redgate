'use client';

import { useRole, UserRole } from '../contexts/RoleContext';
import { Shield, Users, Package, UserCog } from 'lucide-react';
import { clsx } from 'clsx';

export function RoleSwitcher() {
    const { role, setRole } = useRole();

    const roles: { id: UserRole; label: string; icon: React.ElementType }[] = [
        { id: 'admin', label: 'Yönetici / Müdür', icon: Shield },
        { id: 'sales', label: 'Satış Personeli', icon: Users },
        { id: 'warehouse', label: 'Depo Sorumlusu', icon: Package },
        { id: 'accountant', label: 'Muhasebeci', icon: UserCog },
    ];

    return (
        <div className="px-4 py-3">
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-2">
                Görünüm (Demo)
            </div>
            <div className="space-y-1">
                {roles.map((r) => {
                    const Icon = r.icon;
                    const isActive = role === r.id;
                    return (
                        <button
                            key={r.id}
                            onClick={() => setRole(r.id)}
                            className={clsx(
                                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
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
        </div>
    );
}
