'use server';

import { prisma } from '@/lib/prisma';
import { toTitleCaseTR } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export async function normalizeAllRegions() {
    try {
        let count = 0;

        // 1. Fix Stores
        const stores = await prisma.store.findMany();
        for (const store of stores) {
            const normalizedCity = toTitleCaseTR(store.city);
            const normalizedRegion = toTitleCaseTR(store.region);

            if (store.city !== normalizedCity || store.region !== normalizedRegion) {
                await prisma.store.update({
                    where: { id: store.id },
                    data: { city: normalizedCity, region: normalizedRegion }
                });
                count++;
            }
        }

        // 2. Fix Sales
        // Since sales have city/region stored plainly, update them too
        const sales = await prisma.sale.findMany(); // Warning: might be large in prod, but ok for now
        for (const sale of sales) {
            const normalizedCity = toTitleCaseTR(sale.city);
            const normalizedRegion = toTitleCaseTR(sale.region);

            if (sale.city !== normalizedCity || sale.region !== normalizedRegion) {
                await prisma.sale.update({
                    where: { id: sale.id },
                    data: { city: normalizedCity, region: normalizedRegion }
                });
                count++;
            }
        }

        // 3. Fix Customer cities if any
        const customers = await prisma.customer.findMany();
        for (const c of customers) {
            if (c.city && c.city !== toTitleCaseTR(c.city)) {
                await prisma.customer.update({
                    where: { id: c.id },
                    data: { city: toTitleCaseTR(c.city) }
                });
                count++;
            }
        }

        revalidatePath('/');
        return { success: true, count };
    } catch (error) {
        console.error("Errors normalizing regions:", error);
        return { success: false, error: "Veri düzeltme sırasında hata oluştu." };
    }
}
