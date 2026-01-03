'use client';

import { TrendingUp, TrendingDown, Target, Wallet, CreditCard, Package, Truck, Clock, ShoppingBag } from 'lucide-react';
import { clsx } from 'clsx';
import { useRole } from '../contexts/RoleContext';
import { SaleDTO } from '../actions/sales';
import { calculateMetrics } from '../utils/metrics';

interface MetricCardProps {
    title: string;
    value: string;
    change?: string;
    isPositive?: boolean;
    icon: React.ElementType;
    color: 'primary' | 'accent' | 'green' | 'red';
}

function MetricCard({ title, value, change, isPositive, icon: Icon, color }: MetricCardProps) {
    const colorMap = {
        primary: 'bg-primary/20 text-primary',
        accent: 'bg-accent/20 text-accent',
        green: 'bg-green-500/20 text-green-500',
        red: 'bg-red-500/20 text-red-500',
    };

    return (
        <div className="bg-card p-6 rounded-2xl border border-border hover:border-primary/50 transition-all duration-300 shadow-lg shadow-black/50">
            <div className="flex justify-between items-start mb-4">
                <div className={clsx("p-3 rounded-xl", colorMap[color])}>
                    <Icon size={24} />
                </div>
                {change && (
                    <div className={clsx("flex items-center text-xs font-medium px-2 py-1 rounded-full", isPositive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>
                        {isPositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                        {change}
                    </div>
                )}
            </div>
            <h3 className="text-secondary-foreground text-sm font-medium mb-1">{title}</h3>
            <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
    );
}

interface SummaryCardsProps {
    data: SaleDTO[];
    targetRevenue?: number;
}

export function SummaryCards({ data, targetRevenue }: SummaryCardsProps) {
    const { role } = useRole();
    const metrics = calculateMetrics(data, targetRevenue);
    const showProfit = role === 'admin' || role === 'accountant';

    const FinancialMetrics = () => (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Toplam Ciro</p>
                        <h3 className="text-xl font-bold text-foreground mt-1">
                            {metrics.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₺
                        </h3>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Wallet size={18} />
                    </div>
                </div>
                <div className="flex items-center text-xs text-green-500">
                    <TrendingUp size={14} className="mr-1" />
                    <span className="font-medium">Hedef: {Math.round(metrics.progress)}%</span>
                </div>
            </div>

            {showProfit && (
                <>
                    <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Toplam Kar</p>
                                <h3 className="text-xl font-bold text-foreground mt-1">
                                    {metrics.totalProfit.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₺
                                </h3>
                            </div>
                            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                <TrendingUp size={18} />
                            </div>
                        </div>
                        <div className="flex items-center text-xs text-green-500">
                            <span className="font-medium">Gayet İyi</span>
                        </div>
                    </div>

                    <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Kar Marjı</p>
                                <h3 className="text-xl font-bold text-foreground mt-1">
                                    {metrics.margin.toFixed(1)}%
                                </h3>
                            </div>
                            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                <Target size={18} />
                            </div>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                            <span className="font-medium">Ortalama</span>
                        </div>
                    </div>
                </>
            )}

            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Toplam Satış</p>
                        <h3 className="text-xl font-bold text-foreground mt-1">
                            {metrics.salesCount}
                        </h3>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        <ShoppingBag size={18} />
                    </div>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                    <span>Adet</span>
                </div>
            </div>

            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Ortalama Sepet</p>
                        <h3 className="text-xl font-bold text-foreground mt-1">
                            {metrics.averageOrderValue.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₺
                        </h3>
                    </div>
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                        <CreditCard size={18} />
                    </div>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                    <span>İşlem Başına</span>
                </div>
            </div>
        </div>
    );

    const OperationalMetrics = () => (
        <>
            {(role === 'admin' || role === 'manager') && (
                <h3 className="text-lg font-semibold text-foreground mb-4 px-1">Depo & Lojistik Durumu</h3>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Bekleyen Gönderiler"
                    value={metrics.unshippedCount.toString()}
                    change={`${metrics.unshippedCount > 5 ? 'Yoğunluk var' : 'Normal seviye'}`}
                    isPositive={metrics.unshippedCount <= 5}
                    icon={Clock}
                    color="red"
                />
                <MetricCard
                    title="Bugün Kargolanan"
                    value={metrics.shippedToday.toString()}
                    change="Düne göre +5"
                    isPositive={true}
                    icon={Truck}
                    color="green"
                />
                <MetricCard
                    title="Toplam Satış"
                    value={metrics.salesCount.toString()}
                    isPositive={true}
                    icon={Package}
                    color="primary"
                />
                <MetricCard
                    title="İade Talepleri"
                    value="2"
                    icon={TrendingDown}
                    color="accent"
                />
            </div>
        </>
    );

    // Warehouse sees ONLY Operational
    if (role === 'warehouse') {
        return <OperationalMetrics />;
    }

    // Sales sees ONLY Financial (or tailored sales metrics)
    if (role === 'sales') {
        return <FinancialMetrics />;
    }

    // Admin/Manager sees BOTH
    return (
        <div>
            <FinancialMetrics />
            <OperationalMetrics />
        </div>
    );
}
