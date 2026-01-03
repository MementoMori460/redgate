'use client';

import { Sidebar } from "./Sidebar";
import { SidebarProvider, useSidebar } from "../contexts/SidebarContext";
import { RoleProvider } from "../contexts/RoleContext";
import { clsx } from "clsx";

function LayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main
                className={clsx(
                    "flex-1 p-8 bg-background transition-all duration-300 ease-in-out",
                    isCollapsed ? "md:ml-20" : "md:ml-64"
                )}
            >
                {children}
            </main>
        </div>
    );
}

export function ClientLayout({ children, session }: { children: React.ReactNode, session?: any }) {
    const normalizedRole = (session?.user?.role || 'sales').toLowerCase();
    const initialRole = normalizedRole as any; // Cast to avoid strict type error for now, or ensure Session type matches
    // Actually, if no session, middleware redirects to login. So we can assume session exists or handle gracefully.
    const initialUser = session?.user?.name || 'Kullanıcı';

    return (
        <SidebarProvider>
            <RoleProvider initialRole={initialRole} initialUser={initialUser}>
                <LayoutContent>{children}</LayoutContent>
            </RoleProvider>
        </SidebarProvider>
    );
}
