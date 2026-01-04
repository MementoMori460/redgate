'use client';

import { TrendingUp, TrendingDown, Clock, Truck, Package, ShoppingBag } from 'lucide-react';
import { clsx } from 'clsx';
import { useRole } from '../contexts/RoleContext';
import { SaleDTO } from '../actions/sales';
import { calculateMetrics } from '../utils/metrics';

interface MetricItemProps {
    title: string;
    value: string;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    className?: string;
}

function MetricItem({ title, value, subValue, trend, trendValue, className }: MetricItemProps) {
    return (
        <div className={clsx("flex flex-col p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card transition-colors", className)}>
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
                {subValue && <span className="text-sm text-muted-foreground">{subValue}</span>}
            </div>
            {(trend || trendValue) && (
                <div className="mt-2 flex items-center text-xs">
                    {trend === 'up' && <TrendingUp size={12} className="text-green-500 mr-1" />}
                    {trend === 'down' && <TrendingDown size={12} className="text-red-500 mr-1" />}
                    <span className={clsx(
                        "font-medium",
                        trend === 'up' ? "text-green-500" : trend === 'down' ? "text-red-500" : "text-muted-foreground"
                    )}>
                        {trendValue}
                    </span>
                </div>
            )}
        </div>
    );
}

interface SummaryCardsProps {
    data: SaleDTO[];
    targetRevenue?: number;
    lateShipmentCount?: number;
}

export function SummaryCards({ data, targetRevenue, lateShipmentCount = 0 }: SummaryCardsProps) {
    const { role } = useRole();
    const metrics = calculateMetrics(data, targetRevenue);
    const showProfit = role === 'admin' || role === 'accountant';

    // Warehouse View
    if (role === 'warehouse') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricItem
                    title="Geciken Sipariş"
                    value={lateShipmentCount.toString()}
                    subValue="Acil"
                    trend={lateShipmentCount > 0 ? 'down' : 'neutral'}
                    className={lateShipmentCount > 0 ? "border-red-500/50 bg-red-500/10" : ""}
                />
                <MetricItem
                    title="Bekleyen"
                    value={metrics.unshippedCount.toString()}
                    subValue="Sipariş"
                    trend={metrics.unshippedCount > 5 ? 'down' : 'up'}
                    trendValue={metrics.unshippedCount > 5 ? 'Yoğunluk' : 'Normal'}
                />
                <MetricItem
                    title="Kargolanan"
                    value={metrics.shippedToday.toString()}
                    subValue="Bugün"
                    trend="up"
                    trendValue="İşlem"
                />
                <MetricItem
                    title="Toplam Satış"
                    value={metrics.salesCount.toString()}
                    subValue="Adet"
                />
            </div>
        );
    }

    // Customer View
    if (role === 'customer') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricItem
                    title="Siparişlerim"
                    value={`${data.length}`}
                    subValue="Adet"
                />
            </div>
        );
    }

    // Standard View (Admin, Manager, Sales, Accountant)
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <MetricItem
                    title="Toplam Ciro"
                    value={`${metrics.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₺`}
                    trend="up"
                    trendValue={`Hedef: %${Math.round(metrics.progress)}`}
                />

                {targetRevenue !== undefined && targetRevenue > 0 && (
                    <MetricItem
                        title="Hedefe Kalan"
                        value={`${Math.max(0, targetRevenue - metrics.totalRevenue).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₺`}
                        subValue={metrics.totalRevenue >= targetRevenue ? "Hedef Tamamlandı!" : "Kalan Tutar"}
                        trend={metrics.totalRevenue >= targetRevenue ? "up" : "neutral"}
                        className={metrics.totalRevenue >= targetRevenue ? "border-green-500/50 bg-green-500/10" : ""}
                    />
                )}

                {showProfit && (
                    <>
                        <MetricItem
                            title="Toplam Kar"
                            value={`${metrics.totalProfit.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ₺`}
                            trend="up"
                            trendValue="Gayet İyi"
                        />
                        <MetricItem
                            title="Kar Marjı"
                            value={`%${metrics.margin.toFixed(1)}`}
                            subValue="Ortalama"
                        />
                    </>
                )}

                <MetricItem
                    title="Toplam Satış"
                    value={`${data.length}`}
                    subValue="Adet"
                />
            </div>

            {/* Operational row for Admins/Managers */}
            {(role === 'admin' || role === 'manager') && (
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1 uppercase tracking-wider">Lojistik Durumu</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricItem
                            title="Geciken Kargo"
                            value={lateShipmentCount.toString()}
                            subValue="Adet"
                            trend={lateShipmentCount > 0 ? 'down' : 'neutral'}
                            trendValue={lateShipmentCount > 0 ? "Dikkat!" : "Sorun Yok"}
                            className={lateShipmentCount > 0 ? "border-red-500/50 bg-red-500/10" : ""}
                        />
                        <MetricItem
                            title="Bekleyen"
                            value={metrics.unshippedCount.toString()}
                            subValue="Sipariş"
                            trend={metrics.unshippedCount > 0 ? 'neutral' : 'up'}
                            trendValue="Sevkiyat Bekliyor"
                        />
                        <MetricItem
                            title="Bugün Kargolanan"
                            value={metrics.shippedToday.toString()}
                            subValue="Paket"
                            trend="up"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
