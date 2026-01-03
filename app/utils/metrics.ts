import { SaleDTO } from "../actions/sales";

export function calculateMetrics(sales: SaleDTO[], targetRevenue: number = 775000) {
    // Current totals
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

    // Filter for operational metrics
    const shippedCount = sales.filter(s => s.isShipped).length;
    const unshippedCount = sales.length - shippedCount;
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.date === today);
    const shippedToday = todaySales.filter(s => s.isShipped).length;

    const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0;

    return {
        totalRevenue,
        totalProfit,
        targetRevenue,
        progress: (totalRevenue / targetRevenue) * 100,
        unshippedCount,
        shippedToday,
        salesCount: sales.length,
        margin,
        averageOrderValue
    };
}
