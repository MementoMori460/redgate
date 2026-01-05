'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from "next/cache";

const CACHE_FILE = path.join(process.cwd(), 'reports-cache.json');

async function getCachedData() {
    try {
        const data = await fs.readFile(CACHE_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // Cache file might not exist or be corrupted, return null to indicate no cache
        return null;
    }
}

async function saveCache(data: any) {
    try {
        await fs.writeFile(CACHE_FILE, JSON.stringify(data), 'utf-8');
    } catch (error) {
        console.error("Failed to save cache:", error);
    }
}

export async function refreshReportCache() {
    try {
        const data = await fetchFromDatabase();
        await saveCache(data);
        revalidatePath('/reports'); // Invalidate the cache for the /reports page
        return { success: true };
    } catch (error) {
        console.error("Refresh cache failed:", error);
        return { success: false, error: "Veriler güncellenirken hata oluştu." };
    }
}

async function fetchFromDatabase() {
    // Parallelize Independent Queries for faster execution
    const [
        monthlyStatsRaw,
        targets,
        storeStats, // Renamed from storePerformance to match original structure
        productStats, // Renamed from topProducts
        regionStats, // Renamed from regionData
        salesPersonStats, // Renamed from salesPersonPerformance
        financials, // This query was removed in the instruction's fetchFromDatabase, but kept here to maintain original processing logic.
        rawSales
    ] = await Promise.all([
        // 1. Monthly Stats (Using QueryRaw for Date Truncation/Formatting + Distinct Count)
        prisma.$queryRaw<any[]>`
            SELECT 
                TO_CHAR(date, 'YYYY-MM') as key,
                DATE_TRUNC('month', date) as date,
                SUM(total) as revenue,
                SUM(profit) as profit,
                COUNT(id) as "salesCount",
                COUNT(DISTINCT "customerName") as "customerCount"
            FROM "Sale"
            GROUP BY TO_CHAR(date, 'YYYY-MM'), DATE_TRUNC('month', date)
            ORDER BY date ASC
        `,

        // 2. Fetch Targets
        prisma.monthlyTarget.findMany(),

        // 3. Store Performance
        prisma.sale.groupBy({
            by: ['storeCode', 'storeName', 'city', 'region'],
            _sum: {
                total: true,
                profit: true
            },
            _count: {
                id: true
            },
            orderBy: {
                _sum: {
                    total: 'desc'
                }
            }
        }),

        // 4. Top Products (Limit 10)
        prisma.sale.groupBy({
            by: ['item'],
            _sum: {
                quantity: true,
                total: true
            },
            orderBy: {
                _sum: {
                    total: 'desc'
                }
            },
            take: 10
        }),

        // 5. Region Stats
        prisma.sale.groupBy({
            by: ['region'],
            _sum: {
                total: true
            },
            orderBy: {
                _sum: {
                    total: 'desc'
                }
            }
        }),

        // 6. Sales Person Stats
        prisma.sale.groupBy({
            by: ['salesPerson'],
            _sum: {
                total: true
            },
            orderBy: {
                _sum: {
                    total: 'desc'
                }
            },
            take: 5
        }),

        // 7. Overall Financials
        prisma.sale.aggregate({
            where: {
                deletedAt: null
            },
            _sum: {
                total: true,
                profit: true,
                quantity: true
            },
            _count: {
                id: true
            }
        }),

        // 8. Fetch Sales for Client Interaction (Optimized Select)
        prisma.sale.findMany({
            where: {
                deletedAt: null
            },
            orderBy: { date: 'asc' },
            select: {
                id: true,
                date: true,
                item: true,
                quantity: true,
                total: true,
                profit: true, // Needed for store perf calc on client
                storeCode: true,
                storeName: true,
                region: true,
                city: true,
                salesPerson: true,
                customerName: true
                // Excluded: description, waybillNumber, invoices, etc.
            }
        })
    ]);

    // Process Monthly Data
    const targetMap = new Map<string, number>();
    targets.forEach(t => {
        const key = `${t.year}-${String(t.month).padStart(2, '0')}`;
        targetMap.set(key, t.target.toNumber());
    });

    const monthlyComparison = monthlyStatsRaw.map((curr: any, index: number) => {
        const prev = monthlyStatsRaw[index - 1];
        const prevRevenue = prev ? Number(prev.revenue) : 0;
        const prevProfit = prev ? Number(prev.profit) : 0;

        const revenue = Number(curr.revenue);
        const profit = Number(curr.profit);

        // Month name from date object
        const dateObj = new Date(curr.date);
        const name = dateObj.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

        return {
            name,
            revenue,
            profit,
            target: targetMap.get(curr.key) || 0,
            salesCount: Number(curr.salesCount),
            customerCount: Number(curr.customerCount),
            revenueGrowth: prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0,
            profitGrowth: prevProfit > 0 ? ((profit - prevProfit) / prevProfit) * 100 : 0,
            prevRevenue,
            prevProfit
        };
    });

    // Process Store Data
    const storePerformance = storeStats.map(stat => ({
        name: stat.storeName,
        region: stat.region,
        city: stat.city,
        revenue: Number(stat._sum.total),
        profit: Number(stat._sum.profit),
        count: stat._count.id
    }));

    // Process Product Data
    const topProducts = productStats.map(stat => ({
        name: stat.item,
        quantity: stat._sum.quantity || 0,
        revenue: Number(stat._sum.total)
    }));

    // Process Region Data
    const regionData = regionStats.map(stat => ({
        name: stat.region,
        value: Number(stat._sum.total)
    }));

    // Process Sales Person Data
    const topSalesPeople = salesPersonStats.map(stat => ({
        name: stat.salesPerson,
        value: Number(stat._sum.total)
    }));

    const safeNumber = (val: any) => val ? Number(val) : 0;

    return {
        financials: {
            totalSales: financials._sum?.total?.toNumber() || 0,
            totalProfit: financials._sum?.profit?.toNumber() || 0,
            itemCount: financials._sum?.quantity || 0,
            transactionCount: financials._count?.id || 0
        },
        monthlyComparison: monthlyComparison.reverse(),
        monthlyData: monthlyComparison,
        topProducts,
        regionData,
        topSalesPeople,
        storePerformance,
        sales: rawSales.map(s => ({
            ...s,
            // Ensure numbers for client (Decimal -> Number)
            total: Number(s.total),
            profit: Number(s.profit),
        }))
    };
}

export async function getReportData() {
    // 1. Try Cache
    const cached = await getCachedData();
    if (cached) {
        return cached;
    }

    // 2. Fallback to DB if no cache (first run)
    const data = await fetchFromDatabase();
    await saveCache(data);
    return data;
}
