'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { useRole } from '../contexts/RoleContext';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingBag } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';

interface MonthlyStat {
    name: string;
    revenue: number;
    profit: number;
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
    }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export function ReportsClient({ data }: ReportsClientProps) {
    const { role } = useRole();
    const { monthlyComparison, regionData, topSalesPeople, topProducts, storePerformance } = data;
    const showProfit = role === 'admin' || role === 'accountant';

    // Reverse monthly data for table (newest first)
    const tableData = [...monthlyComparison].reverse();
    // Chart data is usually oldest first
    const chartData = monthlyComparison;

    const currentMonth = tableData[0] || { revenue: 0, profit: 0, revenueGrowth: 0, profitGrowth: 0, salesCount: 0 };

    // Process Region Data: Remove Unknown, Sort by Value, Take Top 3
    const processedRegionData = regionData
        .filter(item => item.name !== 'Unknown' && item.name !== 'unknown')
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);

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
                        Finansal Genel Bakış (Aylık)
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
                                    formatter={(value: any) => typeof value === 'number' ? value.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) : value}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                <Bar dataKey="revenue" name="Ciro" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                {showProfit && <Bar dataKey="profit" name="Kar" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Region Chart - Span 4 */}
                <div className="md:col-span-4 bg-card border border-border/50 rounded-xl p-4 shadow-sm min-h-[350px]">
                    <h3 className="text-sm font-semibold mb-4">Bölgesel Dağılım (Top 3)</h3>
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
                        <h3 className="text-sm font-semibold">Aylık Karşılaştırma Raporu</h3>
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
                    <div className="p-4 border-b border-border/50">
                        <h3 className="text-sm font-semibold">En Çok Satan Ürünler (Ciro Bazlı)</h3>
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
                    <div className="p-4 border-b border-border/50">
                        <h3 className="text-sm font-semibold">Mağaza Performansı</h3>
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
