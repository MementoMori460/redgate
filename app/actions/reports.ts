'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getReportData() {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    // Fetch all sales
    const sales = await prisma.sale.findMany({
        orderBy: { date: 'asc' }
    });

    // 1. Monthly Comparison Logic
    const monthlyStats = new Map<string, {
        date: Date,
        name: string,
        revenue: number,
        profit: number,
        salesCount: number,
        customers: Set<string>
    }>();

    sales.forEach(sale => {
        const date = new Date(sale.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        // Full month name for display
        const monthName = date.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

        if (!monthlyStats.has(key)) {
            monthlyStats.set(key, {
                date: new Date(date.getFullYear(), date.getMonth(), 1), // First day of month for sorting
                name: monthName,
                revenue: 0,
                profit: 0,
                salesCount: 0,
                customers: new Set()
            });
        }

        const stat = monthlyStats.get(key)!;
        stat.revenue += sale.total.toNumber();
        stat.profit += sale.profit.toNumber();
        stat.salesCount += 1;
        if (sale.customerName) stat.customers.add(sale.customerName);
    });

    // Convert Map to Array and Sort by Date
    const sortedMonths = Array.from(monthlyStats.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Fetch Monthly Targets
    const targets = await prisma.monthlyTarget.findMany();
    const targetMap = new Map<string, number>();
    targets.forEach(t => {
        // targets are stored with day=1, but let's key by YYYY-MM
        const key = `${t.year}-${String(t.month).padStart(2, '0')}`;
        targetMap.set(key, t.target.toNumber());
    });

    // Calculate MoM Growth
    const monthlyComparison = sortedMonths.map((curr, index) => {
        const prev = sortedMonths[index - 1];
        const prevRevenue = prev ? prev.revenue : 0;
        const prevProfit = prev ? prev.profit : 0;
        const dateKey = `${curr.date.getFullYear()}-${String(curr.date.getMonth() + 1).padStart(2, '0')}`;

        return {
            name: curr.name,
            revenue: curr.revenue,
            profit: curr.profit,
            target: targetMap.get(dateKey) || 0, // Add Target
            salesCount: curr.salesCount,
            customerCount: curr.customers.size,
            revenueGrowth: prevRevenue > 0 ? ((curr.revenue - prevRevenue) / prevRevenue) * 100 : 0,
            profitGrowth: prevProfit > 0 ? ((curr.profit - prevProfit) / prevProfit) * 100 : 0,
            prevRevenue,
            prevProfit
        };
    });

    // 2. Store Performance
    const storeStats = new Map<string, { name: string, region: string, city: string, revenue: number, profit: number, count: number }>();
    sales.forEach(sale => {
        const key = sale.storeCode || sale.storeName; // Use code if available, fallback to name
        if (!storeStats.has(key)) {
            storeStats.set(key, { name: sale.storeName, region: sale.region, city: sale.city, revenue: 0, profit: 0, count: 0 });
        }
        const stat = storeStats.get(key)!;
        stat.revenue += sale.total.toNumber();
        stat.profit += sale.profit.toNumber();
        stat.count += 1;
    });

    const storePerformance = Array.from(storeStats.values())
        .sort((a, b) => b.revenue - a.revenue);

    // 3. Category/Product Performance (Top 10)
    const productStats = new Map<string, { name: string, quantity: number, revenue: number }>();
    sales.forEach(sale => {
        const product = sale.item;
        if (!productStats.has(product)) {
            productStats.set(product, { name: product, quantity: 0, revenue: 0 });
        }
        const stat = productStats.get(product)!;
        stat.quantity += sale.quantity;
        stat.revenue += sale.total.toNumber();
    });

    const topProducts = Array.from(productStats.values())
        .sort((a, b) => b.revenue - a.revenue) // Sort by revenue for impact
        .slice(0, 10);

    // 4. Region Stats (Pie Chart Data)
    const regionStats = new Map<string, number>();
    sales.forEach(sale => {
        regionStats.set(sale.region, (regionStats.get(sale.region) || 0) + sale.total.toNumber());
    });
    const regionData = Array.from(regionStats.entries()).map(([name, value]) => ({ name, value }));

    // 5. Sales Person Performance
    const salesPersonStats = new Map<string, number>();
    sales.forEach(sale => {
        salesPersonStats.set(sale.salesPerson, (salesPersonStats.get(sale.salesPerson) || 0) + sale.total.toNumber());
    });
    const topSalesPeople = Array.from(salesPersonStats.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);


    // 6. Calculate Financials (Total Revenue, Profit, Count)
    const financials = await prisma.sale.aggregate({
        _sum: {
            total: true,
            profit: true
        },
        _count: {
            id: true
        }
    });

    const safeNumber = (val: any) => val ? Number(val) : 0;

    // Return data
    return {
        financials: {
            totalRevenue: safeNumber(financials._sum.total),
            totalProfit: safeNumber(financials._sum.profit),
            totalCost: safeNumber(financials._sum.total) - safeNumber(financials._sum.profit),
            totalSales: financials._count.id
        },
        monthlyComparison: monthlyComparison.reverse(),
        monthlyData: monthlyComparison,
        topProducts,
        regionData,
        topSalesPeople,
        storePerformance,
        sales: sales.map(s => ({
            ...s,
            price: Number(s.price),
            total: Number(s.total),
            profit: Number(s.profit),
        }))
    };
}
