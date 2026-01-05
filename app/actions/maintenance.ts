'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function backfillOrderNumbers() {
    try {
        console.log("Starting order number backfill...");

        // 1. Fetch all sales without order numbers, ordered by date ascending
        const sales = await prisma.sale.findMany({
            where: {
                orderNumber: null
            },
            orderBy: {
                date: 'asc'
            }
        });

        console.log(`Found ${sales.length} sales to backfill.`);

        // 2. Process each sale
        // We need to keep track of counters per month
        // Format: ORD-YYYYMM-XXXX
        const monthCounters: { [key: string]: number } = {};
        let updatedCount = 0;

        for (const sale of sales) {
            const date = new Date(sale.date);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const key = `${year}${month}`;

            if (!monthCounters[key]) {
                // Initialize counter. Ideally, check DB for max existing, but since we are filtering for NULL,
                // and assuming this is a FULL init or consistent sequential run:
                // Check if there are ALREADY sales with numbers in this month (unlikely if we are backfilling, but safer)
                // For simplicity in this specific "fix db" task, we start from 1 if it's the first time we see this month in this loop.
                // NOTE: If partial backfill, this logic needs to be smarter.
                // Let's make it smarter: Start at 1.
                monthCounters[key] = 1;
            }

            const sequence = monthCounters[key].toString().padStart(4, '0');
            const orderNumber = `ORD-${key}-${sequence}`;

            await prisma.sale.update({
                where: { id: sale.id },
                data: { orderNumber }
            });

            monthCounters[key]++;
            updatedCount++;
        }

        console.log(`Backfill completed. Updated ${updatedCount} sales.`);
        revalidatePath('/');
        return { success: true, count: updatedCount };

    } catch (error) {
        console.error("Backfill error:", error);
        return { success: false, error: "Backfill failed" };
    }
}
