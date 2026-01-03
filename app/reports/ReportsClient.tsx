'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { useRole } from '../contexts/RoleContext';

interface ReportsClientProps {
    data: {
        monthlyData: { name: string; revenue: number; profit: number }[];
        regionData: { name: string; value: number }[];
        topSalesPeople: { name: string; value: number }[];
        topProducts: { name: string; value: number }[];
    }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function ReportsClient({ data }: ReportsClientProps) {
    const { role } = useRole();
    const { monthlyData, regionData, topSalesPeople, topProducts } = data;

    const totalRevenue = monthlyData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalProfit = monthlyData.reduce((acc, curr) => acc + curr.profit, 0);
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const showProfit = role === 'admin' || role === 'accountant';

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-${showProfit ? '3' : '1'} gap-4`}>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">Toplam Ciro</p>
                    <h3 className="text-2xl font-bold text-blue-500">{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</h3>
                </div>
                {showProfit && (
                    <>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <p className="text-sm text-muted-foreground">Toplam Kar</p>
                            <h3 className="text-2xl font-bold text-green-500">{totalProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</h3>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-4">
                            <p className="text-sm text-muted-foreground">Kar Marjı</p>
                            <h3 className="text-2xl font-bold">{profitMargin.toFixed(1)}%</h3>
                        </div>
                    </>
                )}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Revenue & Profit */}
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm h-[400px]">
                    <h3 className="text-lg font-semibold mb-4">Aylık Ciro {showProfit && 've Kar'}</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={monthlyData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                formatter={(value: number | string | Array<number | string> | undefined) =>
                                    typeof value === 'number'
                                        ? value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })
                                        : String(value)
                                }
                            />
                            <Legend />
                            <Bar dataKey="revenue" name="Ciro" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            {showProfit && <Bar dataKey="profit" name="Kar" fill="#10b981" radius={[4, 4, 0, 0]} />}
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Region Distribution */}
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm h-[400px]">
                    <h3 className="text-lg font-semibold mb-4">Bölgesel Satış Dağılımı</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={regionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {regionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                formatter={(value: number | string | Array<number | string> | undefined) =>
                                    typeof value === 'number'
                                        ? value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })
                                        : String(value)
                                }
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Sales People */}
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm h-[400px]">
                    <h3 className="text-lg font-semibold mb-4">En İyi Plasiyerler</h3>
                    <div className="space-y-4">
                        {topSalesPeople.map((person, index) => (
                            <div key={index} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{person.name}</span>
                                    <span className="text-muted-foreground">{person.value.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} TL</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ width: `${(person.value / topSalesPeople[0].value) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm h-[400px]">
                    <h3 className="text-lg font-semibold mb-4">En Çok Satılan Ürünler (Adet)</h3>
                    <div className="space-y-4">
                        {topProducts.map((product, index) => (
                            <div key={index} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{product.name}</span>
                                    <span className="text-muted-foreground">{product.value} Adet</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500 rounded-full"
                                        style={{ width: `${(product.value / topProducts[0].value) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
