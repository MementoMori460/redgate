
'use client';

import { SummaryCards } from "./SummaryCards";
import { SalesTable } from "./SalesTable";
import { AddSaleForm } from "./AddSaleForm";
import { NotificationCenter } from "./NotificationCenter";
import { Plus, ArrowLeft, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SaleDTO } from "../actions/sales";

import { User } from "next-auth";
import { ShoppingBag, User as UserIcon } from "lucide-react";
import { useRole } from "../contexts/RoleContext";

interface DashboardClientProps {
    sales: SaleDTO[];
    user?: User; // Keeping it for initial state or fallback if needed, but we'll prefer context
    targetRevenue?: number;
    lateShipmentCount?: number;
}

export function DashboardClient({ sales, user, targetRevenue, lateShipmentCount }: DashboardClientProps) {
    const { role } = useRole(); // Use role from context
    const router = useRouter();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        if (role === 'customer') {
            router.push('/customer/order');
        }
    }, [role, router]);

    const [customTarget, setCustomTarget] = useState<number | null>(null);

    const handlePrevMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + 1);
            return newDate;
        });
    };

    // Fetch target when month changes
    useEffect(() => {
        import('../actions/sales').then(({ getMonthlyTarget }) => {
            getMonthlyTarget(currentDate.getMonth(), currentDate.getFullYear()).then(data => {
                if (data) setCustomTarget(data.target);
                else setCustomTarget(null);
            });
        });
    }, [currentDate]);

    // Filter sales by selected month
    const filteredSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.getMonth() === currentDate.getMonth() &&
            saleDate.getFullYear() === currentDate.getFullYear();
    });

    const salesData = filteredSales;

    // Calculate metrics based on FILTERED data
    const totalRevenue = salesData.reduce((acc, sale) => acc + sale.total, 0);
    const recentSales = salesData.slice(0, 5);
    const salesByPerson = salesData.reduce((acc: Record<string, number>, sale) => {
        acc[sale.salesPerson || 'Unknown'] = (acc[sale.salesPerson || 'Unknown'] || 0) + sale.total;
        return acc;
    }, {});

    const monthName = currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    {/* Header */}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {(role === 'admin' || role === 'sales' || role === 'manager') && (
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shadow-primary/20"
                        >
                            <Plus size={16} />
                            Satış Ekle
                        </button>
                    )}
                </div>
            </div>

            {isFormOpen && (
                <AddSaleForm
                    onClose={() => setIsFormOpen(false)}
                    user={user}
                />
            )}

            <SummaryCards
                data={salesData}
                targetRevenue={customTarget ?? targetRevenue}
                lateShipmentCount={lateShipmentCount}
            />

            {/* Warehouse role sees only summary cards */}
            {role === 'warehouse' ? null : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <ShoppingBag size={18} className="text-primary" />
                            Son Satışlar
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="text-muted-foreground border-b border-border/50 uppercase tracking-wider bg-secondary/10">
                                    <tr>
                                        <th className="px-3 py-2.5 font-medium">Mağaza</th>
                                        <th className="px-3 py-2.5 font-medium">Ürün</th>
                                        <th className="px-3 py-2.5 font-medium text-right">Tutar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {recentSales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-secondary/20 transition-colors">
                                            <td className="px-3 py-2">
                                                <div className="font-medium text-foreground">{sale.storeName}</div>
                                                <div className="text-[10px] text-muted-foreground">{sale.city}</div>
                                            </td>
                                            <td className="px-3 py-2 text-foreground">{sale.item}</td>
                                            <td className="px-3 py-2 text-right font-mono font-medium text-foreground">
                                                {sale.total.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺
                                            </td>
                                        </tr>
                                    ))}
                                    {recentSales.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                                                Bu ay henüz satış yok.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {(role === 'admin' || role === 'manager' || role === 'accountant') && (
                        <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
                            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <UserIcon size={18} className="text-blue-500" />
                                Personel Performansı
                            </h2>
                            <div className="space-y-3">
                                {Object.entries(salesByPerson)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 5)
                                    .map(([person, total], index) => (
                                        <div key={person} className="flex items-center gap-3 group">
                                            <span className="font-mono text-sm font-bold text-muted-foreground w-4 text-center group-hover:text-primary transition-colors">{index + 1}</span>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1.5">
                                                    <span className="text-sm font-medium text-foreground">{person}</span>
                                                    <span className="text-xs font-mono text-foreground font-medium">{total.toLocaleString('tr-TR')} ₺</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${(total / Object.values(salesByPerson).reduce((a, b) => Math.max(a, b), 0)) * 100}% ` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                {Object.keys(salesByPerson).length === 0 && (
                                    <div className="text-center text-muted-foreground py-6 text-sm">
                                        Veri bulunamadı.
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

