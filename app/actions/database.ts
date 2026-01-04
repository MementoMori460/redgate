'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function exportDatabase() {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    const [stores, customers, products, sales] = await Promise.all([
        prisma.store.findMany(),
        prisma.customer.findMany(),
        prisma.product.findMany(),
        prisma.sale.findMany(),
    ]);

    return {
        timestamp: new Date().toISOString(),
        data: {
            stores,
            customers,
            products,
            sales
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

    const { stores, customers, products, sales } = data.data;

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

        return { success: true, message: 'Restore completed successfully' };

    } catch (error) {
        console.error('Restore failed:', error);
        throw new Error('Restore failed: ' + (error as Error).message);
    }
}
