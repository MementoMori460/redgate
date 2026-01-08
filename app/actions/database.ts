'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function exportDatabase() {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    const [stores, customers, products, sales, targets, suppliers, users, globalSettings] = await Promise.all([
        prisma.store.findMany(),
        prisma.customer.findMany(),
        prisma.product.findMany(),
        prisma.sale.findMany(),
        prisma.monthlyTarget.findMany(),
        prisma.supplier.findMany(),
        prisma.user.findMany(),
        prisma.globalSettings.findMany(),
    ]);

    // Helper to serialize decimals
    const serializeDecimal = (num: any) => num?.toNumber() ?? 0;
    const serializeOptionalDecimal = (num: any) => num?.toNumber() ?? null;

    return {
        timestamp: new Date().toISOString(),
        data: {
            stores,
            customers,
            suppliers: suppliers.map(s => ({
                ...s,
                createdAt: s.createdAt.toISOString(),
                updatedAt: s.updatedAt.toISOString()
            })),
            products: products.map(p => ({
                ...p,
                price: serializeOptionalDecimal(p.price),
                cost: serializeOptionalDecimal(p.cost),
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString()
            })),
            sales: sales.map(s => ({
                ...s,
                price: serializeDecimal(s.price),
                total: serializeDecimal(s.total),
                profit: serializeDecimal(s.profit),
                date: s.date.toISOString(),
                createdAt: s.createdAt.toISOString(),
                updatedAt: s.updatedAt.toISOString(),
                // Keep deletedAt as ISO string if exists (it comes as Date from prisma)
                deletedAt: s.deletedAt ? s.deletedAt.toISOString() : null
            })),
            monthlyTargets: targets.map(t => ({
                ...t,
                target: serializeDecimal(t.target),
                success: serializeOptionalDecimal(t.success),
                createdAt: t.createdAt.toISOString(),
                updatedAt: t.updatedAt.toISOString()
            })),
            users: users.map(u => ({
                ...u,
                createdAt: u.createdAt.toISOString(),
                updatedAt: u.updatedAt.toISOString()
            })),
            globalSettings
        }
    };
}

export async function importDatabase(data: any) {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    if (!data || !data.data) {
        throw new Error('Invalid backup file format');
    }

    const { stores, customers, products, sales, monthlyTargets, suppliers, users, globalSettings } = data.data;

    try {
        // Restore Stores
        if (stores?.length) {
            for (const store of stores) {
                await prisma.store.upsert({
                    where: { code: store.code },
                    update: { ...store },
                    create: { ...store }
                });
            }
        }

        // Restore Customers
        if (customers?.length) {
            for (const customer of customers) {
                await prisma.customer.upsert({
                    where: { id: customer.id },
                    update: { ...customer },
                    create: { ...customer }
                });
            }
        }

        // Restore Suppliers (Must be before products)
        if (suppliers?.length) {
            for (const supplier of suppliers) {
                await prisma.supplier.upsert({
                    where: { id: supplier.id },
                    update: { ...supplier },
                    create: { ...supplier }
                });
            }
        }

        // Restore Products
        if (products?.length) {
            for (const product of products) {
                await prisma.product.upsert({
                    where: { productNumber: product.productNumber },
                    update: { ...product },
                    create: { ...product }
                });
            }
        }

        // Restore Sales
        if (sales?.length) {
            // For sales, we might want to delete existing to avoid duplication if IDs match, 
            // or just upsert if ID is preserved.
            // Given volume, createMany with skipDuplicates is safer/faster for restore
            // But if we want to UPDATE existing, we need upsert loop or deleteMany first?
            // Let's assume restore appends/updates.

            // To prevent massive loops, let's try createMany first for speed.
            // NOTE: createMany with skipDuplicates does NOT update existing.
            // If this is a "Restore", maybe we should wipe or just upsert?
            // User just did a migration, so "Merge/Restore" is safer than Wipe.

            for (const sale of sales) {
                await prisma.sale.upsert({
                    where: { id: sale.id }, // ID must exist in backup
                    update: { ...sale },
                    create: { ...sale }
                });
            }
        }

        // Restore Monthly Targets
        if (monthlyTargets?.length) {
            for (const target of monthlyTargets) {
                await prisma.monthlyTarget.upsert({
                    where: {
                        month_year: {
                            month: target.month,
                            year: target.year
                        }
                    },
                    update: { ...target },
                    create: { ...target }
                });
            }
        }

        if (users?.length) {
            for (const user of users) {
                // Skip if user exists? Or update roles?
                // Let's upsert to allow password resets/role changes via restore
                await prisma.user.upsert({
                    where: { username: user.username },
                    update: { ...user },
                    create: { ...user }
                });
            }
        }

        // Restore GlobalSettings
        if (globalSettings?.length) {
            for (const setting of globalSettings) {
                await prisma.globalSettings.upsert({
                    where: { key: setting.key },
                    update: { ...setting },
                    create: { ...setting }
                });
            }
        }

        return { success: true, message: 'Restore completed successfully' };

    } catch (error) {
        console.error('Restore failed:', error);
        throw new Error('Restore failed: ' + (error as Error).message);
    }
}
