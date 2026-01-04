'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getNotifications() {
    try {
        const session = await auth();
        if (!session?.user) return [];

        // Determine target role/user
        // For now, simple logic: Admins see all 'admin' type notifications
        // Users see their own?
        // Let's implement schema later, for now we can infer "Pending Orders" as notifications for Admins

        const role = session.user.role?.toLowerCase();

        const notifications: { id: string; title: string; message: string; type: string; time: string; isRead: boolean; link: string }[] = [];

        // 1. Pending Sales (For Admins)
        if (role === 'admin' || role === 'manager' || role === 'warehouse') {
            const pendingSales = await prisma.sale.findMany({
                where: { status: 'PENDING' },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { customer: true }
            });

            pendingSales.forEach(sale => {
                notifications.push({
                    id: `sale-${sale.id}`,
                    title: 'Yeni Sipariş',
                    message: `${sale.customerName} - ${sale.item} (${sale.quantity} Adet)`,
                    type: 'info',
                    time: sale.createdAt.toISOString(),
                    isRead: false, // Inferred
                    link: '/admin/orders'
                });
            });
        }

        // 2. Late Shipments (For Admins/Warehouse)
        // ... previous logic from utils/notifications can be integrated here

        return notifications;
    } catch (error) {
        console.error("Failed to get notifications:", error);
        return [];
    }
}

export async function getPendingOrdersCount() {
    try {
        const count = await prisma.sale.count({
            where: { status: 'PENDING' }
        });
        return count;
    } catch (error) {
        return 0;
    }
}
