'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { useRole } from '../contexts/RoleContext';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingBag } from 'lucide-react';
import { clsx } from 'clsx';
import { useState, useMemo } from 'react';

interface MonthlyStat {
    name: string;
    revenue: number;
    profit: number;
    target: number; // New field
    salesCount: number;
    customerCount: number;
    revenueGrowth: number;
    profitGrowth: number;
    prevRevenue: number;
    prevProfit: number;
}

interface StoreStat {
    name: string;
    region: string;
    city: string;
    revenue: number;
    profit: number;
    count: number;
}

interface ReportsClientProps {
    data: {
        monthlyComparison: MonthlyStat[];
        monthlyData: MonthlyStat[]; // Same as comparison but potentially sorted differently by server, here we treat same
        regionData: { name: string; value: number }[];
        topSalesPeople: { name: string; value: number }[];
        topProducts: { name: string; quantity: number; revenue: number }[];
        storePerformance: StoreStat[];
        sales: any[]; // Using any to avoid importing full Sale type for now, but strict typing is better long term
    }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export function ReportsClient({ data }: ReportsClientProps) {
    const { role } = useRole();
    const { monthlyComparison, regionData, topSalesPeople, topProducts: initialTopProducts, storePerformance: initialStorePerformance, sales } = data;
    const showProfit = role === 'admin' || role === 'accountant';

    // Time Range State
    const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | '1y' | 'all'>('all');

    // Filter Sales based on Range
    const filteredSales = useMemo(() => {
        if (timeRange === 'all') return sales;

        const now = new Date();
        const cutoff = new Date();

        if (timeRange === '1m') cutoff.setMonth(now.getMonth() - 1);
        if (timeRange === '3m') cutoff.setMonth(now.getMonth() - 3);
        if (timeRange === '6m') cutoff.setMonth(now.getMonth() - 6);
        if (timeRange === '1y') cutoff.setFullYear(now.getFullYear() - 1);

        return sales.filter(s => new Date(s.date) >= cutoff);
    }, [sales, timeRange]);

    // Recalculate Top Products
    const topProducts = useMemo(() => {
        const productStats = new Map<string, { name: string, quantity: number, revenue: number }>();
        filteredSales.forEach((sale: any) => {
            const product = sale.item;
            if (!productStats.has(product)) {
                productStats.set(product, { name: product, quantity: 0, revenue: 0 });
            }
            const stat = productStats.get(product)!;
            stat.quantity += sale.quantity;
            stat.revenue += Number(sale.total); // Ensure number
        });

        return Array.from(productStats.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
    }, [filteredSales]);

    // Recalculate Store Performance
    const storePerformance = useMemo(() => {
        const storeStats = new Map<string, { name: string, region: string, city: string, revenue: number, profit: number, count: number }>();
        filteredSales.forEach((sale: any) => {
            const key = sale.storeCode || sale.storeName;
            if (!storeStats.has(key)) {
                storeStats.set(key, { name: sale.storeName, region: sale.region, city: sale.city, revenue: 0, profit: 0, count: 0 });
            }
            const stat = storeStats.get(key)!;
            stat.revenue += Number(sale.total);
            stat.profit += Number(sale.profit);
            stat.count += 1;
        });

        return Array.from(storeStats.values())
            .sort((a, b) => b.revenue - a.revenue);
    }, [filteredSales]);


    // Reverse monthly data for table (newest first)
    const tableData = [...monthlyComparison];
    // Chart data is usually oldest first
    const chartData = monthlyComparison; // They are passed correct/ASC from server, client reverses for table

    const currentMonth = tableData[0] || { revenue: 0, profit: 0, revenueGrowth: 0, profitGrowth: 0, salesCount: 0 };

    // Process Region Data: Remove Unknown, Sort by Value, Take Top 3 + Other
    const filteredRegions = regionData
        .filter(item => item.name !== 'Unknown' && item.name !== 'unknown')
        .sort((a, b) => b.value - a.value);

    const top3 = filteredRegions.slice(0, 3);
    const otherRegions = filteredRegions.slice(3);
    const otherTotal = otherRegions.reduce((sum, item) => sum + item.value, 0);

    const processedRegionData = [...top3];
    if (otherTotal > 0) {
        processedRegionData.push({ name: 'Diğer', value: otherTotal });
    }

    return (
        <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                    title="Bu Ay Ciro"
                    value={currentMonth.revenue}
                    growth={currentMonth.revenueGrowth}
                    icon={DollarSign}
                    isCurrency
                />
                {showProfit && (
                    <KPICard
                        title="Bu Ay Kar"
                        value={currentMonth.profit}
                        growth={currentMonth.profitGrowth}
                        icon={TrendingUp}
                        isCurrency
                        color="green"
                    />
                )}
                <KPICard
                    title="Sipariş Adedi"
                    value={currentMonth.salesCount}
                    icon={ShoppingBag}
                />
                <KPICard
                    title="Aktif Ürün"
                    value={topProducts.length}
                    icon={Package}
                    subText="Satılan Çeşit"
                />
            </div>

            {/* Main Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Monthly Revenue Chart - Span 8 */}
                <div className="md:col-span-8 bg-card border border-border/50 rounded-xl p-4 shadow-sm min-h-[350px]">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-primary" />
                        Finansal Genel Bakış (Son 6 Ay)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                                    formatter={(value: any, name: any) => {
                                        if (name === 'Hedef') {
                                            const val = Number(value);
                                            return [val > 0 ? val.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ₺' : '0 ₺', name];
                                        }
                                        return [typeof value === 'number' ? value.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) : value, name];
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                <Bar dataKey="revenue" name="Ciro" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                {showProfit && <Bar dataKey="profit" name="Kar" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />}
                                <Line type="monotone" dataKey="target" name="Hedef" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Region Chart - Span 4 */}
                <div className="md:col-span-4 bg-card border border-border/50 rounded-xl p-4 shadow-sm min-h-[350px]">
                    <h3 className="text-sm font-semibold mb-4">Bölgesel Dağılım</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={processedRegionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={(props: any) => `${props.name} ${((props.percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {processedRegionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Comparison Table - Span 12 */}
                <div className="md:col-span-12 bg-card border border-border/50 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-border/50">
                        <h3 className="text-sm font-semibold">Aylık Karşılaştırma Raporu ({tableData.length > 0 ? `${tableData[tableData.length - 1].name} - ${tableData[0].name}` : 'Tüm Zamanlar'})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-secondary/30 text-xs uppercase text-muted-foreground font-medium">
                                <tr>
                                    <th className="px-4 py-3 text-left">Dönem</th>
                                    <th className="px-4 py-3 text-right">Ciro</th>
                                    <th className="px-4 py-3 text-right">Değişim</th>
                                    {showProfit && <th className="px-4 py-3 text-right">Kar</th>}
                                    {showProfit && <th className="px-4 py-3 text-right">Kar Değişimi</th>}
                                    <th className="px-4 py-3 text-right">Sipariş</th>
                                    <th className="px-4 py-3 text-right">Müşteri</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {tableData.map((row) => (
                                    <tr key={row.name} className="hover:bg-secondary/20 transition-colors">
                                        <td className="px-4 py-2 font-medium">{row.name}</td>
                                        <td className="px-4 py-2 text-right">{row.revenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</td>
                                        <td className="px-4 py-2 text-right">
                                            <TrendBadge value={row.revenueGrowth} />
                                        </td>
                                        {showProfit && (
                                            <>
                                                <td className="px-4 py-2 text-right text-green-600 font-medium">{row.profit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</td>
                                                <td className="px-4 py-2 text-right">
                                                    <TrendBadge value={row.profitGrowth} />
                                                </td>
                                            </>
                                        )}
                                        <td className="px-4 py-2 text-right">{row.salesCount}</td>
                                        <td className="px-4 py-2 text-right">{row.customerCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Products - Span 6 */}
                <div className="md:col-span-6 bg-card border border-border/50 rounded-xl shadow-sm h-[400px] flex flex-col">
                    <div className="p-4 border-b border-border/50 flex justify-between items-center">
                        <h3 className="text-sm font-semibold">En Çok Satan Ürünler</h3>
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as any)}
                            className="text-xs bg-secondary/50 border border-border/50 rounded-lg px-2 py-1 outline-none font-medium"
                        >
                            <option value="1m">Son 1 Ay</option>
                            <option value="3m">Son 3 Ay</option>
                            <option value="6m">Son 6 Ay</option>
                            <option value="1y">Son 1 Yıl</option>
                            <option value="all">Tüm Zamanlar</option>
                        </select>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-muted-foreground sticky top-0 bg-card">
                                <tr>
                                    <th className="px-4 py-2 text-left">Ürün</th>
                                    <th className="px-4 py-2 text-right">Adet</th>
                                    <th className="px-4 py-2 text-right">Ciro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {topProducts.map((p, i) => (
                                    <tr key={i} className="hover:bg-secondary/30">
                                        <td className="px-4 py-2">{p.name}</td>
                                        <td className="px-4 py-2 text-right text-muted-foreground">{p.quantity}</td>
                                        <td className="px-4 py-2 text-right font-medium">{p.revenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Store Performance - Span 6 */}
                <div className="md:col-span-6 bg-card border border-border/50 rounded-xl shadow-sm h-[400px] flex flex-col">
                    <div className="p-4 border-b border-border/50 flex justify-between items-center">
                        <h3 className="text-sm font-semibold">Mağaza Performansı</h3>
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as any)}
                            className="text-xs bg-secondary/50 border border-border/50 rounded-lg px-2 py-1 outline-none font-medium"
                        >
                            <option value="1m">Son 1 Ay</option>
                            <option value="3m">Son 3 Ay</option>
                            <option value="6m">Son 6 Ay</option>
                            <option value="1y">Son 1 Yıl</option>
                            <option value="all">Tüm Zamanlar</option>
                        </select>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-muted-foreground sticky top-0 bg-card">
                                <tr>
                                    <th className="px-4 py-2 text-left">Mağaza</th>
                                    <th className="px-4 py-2 text-left">Şehir</th>
                                    <th className="px-4 py-2 text-right">Ciro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {storePerformance.slice(0, 10).map((s, i) => (
                                    <tr key={i} className="hover:bg-secondary/30">
                                        <td className="px-4 py-2 font-medium">{s.name}</td>
                                        <td className="px-4 py-2 text-muted-foreground text-xs uppercase">{s.city}</td>
                                        <td className="px-4 py-2 text-right font-medium">{s.revenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

// Micro Components

function KPICard({ title, value, growth, icon: Icon, isCurrency, subText, color = 'blue' }: any) {
    const formattedValue = isCurrency
        ? value.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ₺'
        : value.toLocaleString('tr-TR');

    return (
        <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-primary/20 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
                <div className={`p-1.5 rounded-lg bg-${color}-500/10 text-${color}-500`}>
                    <Icon size={16} />
                </div>
            </div>

            <div className="space-y-1">
                <h3 className="text-2xl font-bold tracking-tight">{formattedValue}</h3>
                {growth !== undefined && (
                    <TrendBadge value={growth} showText />
                )}
                {subText && (
                    <p className="text-xs text-muted-foreground">{subText}</p>
                )}
            </div>
        </div>
    )
}

function TrendBadge({ value, showText = false }: { value: number, showText?: boolean }) {
    const isPositive = value > 0;
    const isNeutral = value === 0;
    const colorClass = isPositive ? 'text-green-500' : isNeutral ? 'text-muted-foreground' : 'text-red-500';
    const bgClass = isPositive ? 'bg-green-500/10' : isNeutral ? 'bg-secondary' : 'bg-red-500/10';
    const Icon = isPositive ? ArrowUp : isNeutral ? TrendingUp : ArrowDown;

    return (
        <div className={clsx("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium", bgClass, colorClass)}>
            <Icon size={12} />
            {Math.abs(value).toFixed(1)}%
            {showText && <span className="ml-1 opacity-75">{isPositive ? 'Artış' : isNeutral ? '' : 'Düşüş'}</span>}
        </div>
    )
}
