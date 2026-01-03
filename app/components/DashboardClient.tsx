
'use client';

import { SummaryCards } from "./SummaryCards";
import { SalesTable } from "./SalesTable";
import { AddSaleForm } from "./AddSaleForm";
import { NotificationCenter } from "./NotificationCenter";
import { Plus } from "lucide-react";
import { useState } from "react";
import { SaleDTO } from "../actions/sales";

import { User } from "next-auth";
import { ShoppingBag, User as UserIcon } from "lucide-react"; // Added for new content

interface DashboardClientProps {
    sales: SaleDTO[];
    user?: User;
    targetRevenue?: number;
}

export function DashboardClient({ sales, user, targetRevenue }: DashboardClientProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);

    // New variables needed for the updated return block
    // These are placeholders and would typically be derived from 'sales' prop
    const salesData = sales; // Assuming 'sales' prop is the salesData
    const totalRevenue = salesData.reduce((acc, sale) => acc + sale.total, 0);
    const totalProfit = salesData.reduce((acc, sale) => acc + (sale.total * 0.2), 0); // Placeholder for profit calculation
    const recentSales = salesData.slice(0, 5); // Get recent sales
    const salesByPerson = salesData.reduce((acc: Record<string, number>, sale) => {
        acc[sale.salesPerson || 'Unknown'] = (acc[sale.salesPerson || 'Unknown'] || 0) + sale.total;
        return acc;
    }, {});


    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Hoşgeldin, {user?.name}
                </h1>
                <div className="text-sm text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-lg shadow-sm">
                    Hedef: {salesData.length > 0 ? ((salesData.reduce((acc, sale) => acc + sale.total, 0) / (targetRevenue || 1)) * 100).toFixed(1) : 0}%
                </div>
            </div>

            <SummaryCards
                data={salesData}
                targetRevenue={targetRevenue}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <ShoppingBag size={18} className="text-primary" />
                        Son Satışlar
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="text-muted-foreground border-b border-border uppercase tracking-wider">
                                <tr>
                                    <th className="px-3 py-2 font-medium">Mağaza</th>
                                    <th className="px-3 py-2 font-medium">Ürün</th>
                                    <th className="px-3 py-2 font-medium text-right">Tutar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {recentSales.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-secondary/30 transition-colors">
                                        <td className="px-3 py-1.5">
                                            <div className="font-medium text-foreground">{sale.storeName}</div>
                                            <div className="text-[10px] text-muted-foreground">{sale.city}</div>
                                        </td>
                                        <td className="px-3 py-1.5 text-foreground">{sale.item}</td>
                                        <td className="px-3 py-1.5 text-right font-mono font-medium text-foreground">
                                            {sale.total.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <UserIcon size={18} className="text-accent" />
                        Personel Performansı
                    </h2>
                    <div className="space-y-3">
                        {Object.entries(salesByPerson)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 5)
                            .map(([person, total], index) => (
                                <div key={person} className="flex items-center gap-3">
                                    <span className="font-mono text-sm font-bold text-muted-foreground w-4 text-center">{index + 1}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-foreground">{person}</span>
                                            <span className="text-xs font-mono text-foreground">{total.toLocaleString('tr-TR')} ₺</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all duration-500"
                                                style={{ width: `${(total / Object.values(salesByPerson).reduce((a, b) => Math.max(a, b), 0)) * 100}% ` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

