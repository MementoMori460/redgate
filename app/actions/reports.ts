'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getReportData() {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    // Fetch all sales for calculation
    // Ideally this would be done with aggregations in SQL, but for speed and flexibility with small data, JS processing is fine.
    const sales = await prisma.sale.findMany({
        orderBy: { date: 'asc' }
    });

    // Monthly Stats
    const monthlyStats = new Map<string, { name: string, revenue: number, profit: number }>();

    sales.forEach(sale => {
        const date = new Date(sale.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleString('tr-TR', { month: 'short' });

        if (!monthlyStats.has(key)) {
            monthlyStats.set(key, { name: monthName, revenue: 0, profit: 0 });
        }

        const stat = monthlyStats.get(key)!;
        stat.revenue += sale.total.toNumber();
        stat.profit += sale.profit.toNumber();
    });

    const monthlyData = Array.from(monthlyStats.values());

    // Region Stats
    const regionStats = new Map<string, number>();
    sales.forEach(sale => {
        const region = sale.region;
        regionStats.set(region, (regionStats.get(region) || 0) + sale.total.toNumber());
    });

    const regionData = Array.from(regionStats.entries()).map(([name, value]) => ({ name, value }));

    // Top Sales People
    const salesPersonStats = new Map<string, number>();
    sales.forEach(sale => {
        const person = sale.salesPerson;
        salesPersonStats.set(person, (salesPersonStats.get(person) || 0) + sale.total.toNumber());
    });

    const topSalesPeople = Array.from(salesPersonStats.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // Top Products
    const productStats = new Map<string, number>();
    sales.forEach(sale => {
        const product = sale.item;
        productStats.set(product, (productStats.get(product) || 0) + sale.quantity);
    });

    const topProducts = Array.from(productStats.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    return {
        monthlyData,
        regionData,
        topSalesPeople,
        topProducts
    };
}
