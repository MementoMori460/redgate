'use client';

import { Search, Filter, MoreHorizontal, ArrowUpRight, Truck, CheckCircle, Clock } from 'lucide-react';
import { useRole } from '../contexts/RoleContext';
import { useState } from 'react';

import { shipSale, SaleDTO } from '../actions/sales';

interface SalesTableProps {
    data: SaleDTO[];
}

export function SalesTable({ data }: SalesTableProps) {
    const { role, currentUser } = useRole();
    // Use optimizing or just local state for instant feedback could be done, 
    // but for now relying on parent re-render is simpler.
    // However, for immediate UI feedback on "Ship", we might want local state initialized from props.
    // Let's use the props directly for the table, but maybe optimistic UI for the specific action?
    // For simplicity:
    const sales = data;

    const filteredSales = sales.filter((sale) => {
        if (role === 'sales') {
            return sale.salesPerson === currentUser; // Note: using salesPerson matching exact string from DB
        }
        return true;
    });

    const handleShip = async (id: string) => {
        if (confirm("Kargolandı olarak işaretlemek istiyor musunuz?")) {
            await shipSale(id);
            // Router refresh is handled in the action, UI should update automatically 
            // if this component re-renders with new props.
        }
    };

    const showTotal = role !== 'warehouse';
    const showProfit = role === 'admin' || role === 'accountant';
    const showShippingActions = role === 'warehouse' || role === 'admin';

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg shadow-black/50">
            <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-foreground">Son Satışlar</h2>
                    <p className="text-sm text-secondary-foreground">
                        {role === 'sales' ? 'Kişisel satış kayıtlarınız' : 'Tüm işlemlerin özeti'}
                    </p>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                        <input
                            type="text"
                            placeholder="Satış ara (Kod, Şehir, Personel)..."
                            className="bg-secondary/50 border-none text-foreground placeholder:text-muted rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none w-full sm:w-64"
                        />
                    </div>
                    <button className="p-2 bg-secondary/50 text-foreground rounded-lg hover:bg-secondary transition-colors">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-secondary-foreground bg-secondary/30 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-6 py-4">Tarih</th>
                            <th className="px-6 py-4">Kod</th>
                            <th className="px-6 py-4">Bölge</th>
                            <th className="px-6 py-4">Şehir / Mağaza</th>
                            <th className="px-6 py-4">Satış Personeli</th>
                            <th className="px-6 py-4">Müşteri</th>
                            <th className="px-6 py-4">Ürün</th>
                            {showTotal && <th className="px-6 py-4 text-right">Toplam</th>}
                            {showProfit && <th className="px-6 py-4 text-right">Kar</th>}
                            <th className="px-6 py-4 text-center">Durum</th>
                            {showShippingActions && <th className="px-6 py-4 text-center">Kargo</th>}
                            <th className="px-6 py-4 text-center">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredSales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-secondary/20 transition-colors">
                                <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">{sale.date}</td>
                                <td className="px-6 py-4 font-mono text-xs text-primary">{sale.storeCode}</td>
                                <td className="px-6 py-4 text-secondary-foreground">{sale.region}</td>
                                <td className="px-6 py-4 text-secondary-foreground">
                                    <div className="flex flex-col">
                                        <span className="text-foreground font-medium">{sale.city}</span>
                                        <span className="text-xs text-muted">{sale.storeName}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-secondary-foreground whitespace-nowrap">{sale.salesPerson}</td>
                                <td className="px-6 py-4 text-secondary-foreground">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-foreground">{sale.customerName || '-'}</span>
                                        {sale.customerContact && <span className="text-xs text-muted">Tel: {sale.customerContact}</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-secondary-foreground">{sale.item}</td>
                                {showTotal && <td className="px-6 py-4 text-right font-medium text-foreground whitespace-nowrap">
                                    {sale.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                </td>}
                                {showProfit && <td className="px-6 py-4 text-right font-medium text-green-400 whitespace-nowrap">
                                    {sale.profit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                </td>}
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${sale.isShipped
                                        ? 'bg-green-500/10 text-green-400'
                                        : 'bg-yellow-500/10 text-yellow-400'
                                        }`}>
                                        {sale.isShipped ? 'Tamamlandı' : 'Bekliyor'}
                                    </span>
                                </td>
                                {showShippingActions && (
                                    <td className="px-6 py-4 text-center">
                                        {sale.isShipped ? (
                                            <span className="flex items-center justify-center text-green-500 text-xs font-medium gap-1">
                                                <CheckCircle size={14} /> Gönderildi
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => sale.id && handleShip(sale.id)}
                                                className="bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 mx-auto transition-colors whitespace-nowrap"
                                            >
                                                <Truck size={14} /> Gönder
                                            </button>
                                        )}
                                    </td>
                                )}
                                <td className="px-6 py-4 text-center">
                                    <button className="text-muted hover:text-foreground transition-colors p-1">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-border flex justify-center">
                <button className="text-primary hover:text-accent text-sm font-medium flex items-center transition-colors">
                    Tüm Satışları Gör <ArrowUpRight size={16} className="ml-1" />
                </button>
            </div>
        </div>
    );
}
