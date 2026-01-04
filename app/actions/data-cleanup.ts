'use server'

import { prisma } from "@/lib/prisma"
import { normalizeCityName } from "../utils/city-normalization"

export async function fixCityNames() {
    try {
        const sales = await prisma.sale.findMany({ select: { id: true, city: true } });
        let updatedCount = 0;

        for (const sale of sales) {
            const normalized = normalizeCityName(sale.city);
            if (normalized !== sale.city) {
                await prisma.sale.update({
                    where: { id: sale.id },
                    data: { city: normalized, region: normalized } // Sync region too if it's just city
                });
                updatedCount++;
            }
        }

        // Fix Customers too
        const customers = await prisma.customer.findMany({ select: { id: true, city: true } });
        let updatedCustCount = 0;
        for (const cust of customers) {
            if (!cust.city) continue;
            const normalized = normalizeCityName(cust.city);
            if (normalized !== cust.city) {
                await prisma.customer.update({
                    where: { id: cust.id },
                    data: { city: normalized }
                });
                updatedCustCount++;
            }
        }

        console.log(`Normalized ${updatedCount} sales and ${updatedCustCount} customers.`);
        return { success: true, message: `Fixed ${updatedCount} sales, ${updatedCustCount} customers.` };
    } catch (error) {
        console.error("Fix Cities Error:", error);
        return { success: false, message: "Failed to fix cities." };
    }
}
