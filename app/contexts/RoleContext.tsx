'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'admin' | 'manager' | 'sales' | 'warehouse' | 'accountant' | 'customer';

interface RoleContextType {
    role: UserRole;
    setRole: (role: UserRole) => void;
    currentUser: string; // Mock user name for filtering
    isOriginalAdmin: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children, initialRole = 'admin', initialUser = 'Admin User' }: { children: ReactNode, initialRole?: UserRole, initialUser?: string }) {
    const [role, setRole] = useState<UserRole>(initialRole);
    // Use initialUser unless we want to keep the mock logic for overriding.
    // For now, let's keep it simple: if role matches initial, use initialUser.

    // Actually, let's respect the passed user, but if switching roles (for demo), maybe mock?
    // Let's assume for production we want the REAL user.
    // But for the "Role Switcher" feature to still work as a demo, we might need to stick to the mock logic when role changes?
    // Let's rely on the props for the initial state.

    // If role matches initial (normalized), use initialUser. 
    // Otherwise fallback to mock names for role switching demo.
    const isInitialRole = role === initialRole;
    const currentUser = isInitialRole ? initialUser : (role === 'sales' ? 'Sezgin İtem' : (role === 'accountant' ? 'Ayşe Muhasebe' : (role === 'admin' ? 'Admin User' : 'Demo User')));

    const isOriginalAdmin = initialRole === 'admin';

    return (
        <RoleContext.Provider value={{ role, setRole, currentUser, isOriginalAdmin }}>
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
}
