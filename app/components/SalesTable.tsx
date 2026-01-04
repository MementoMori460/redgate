'use client';

import { Search, Filter, MoreHorizontal, ArrowUpRight, Truck, CheckCircle, Clock } from 'lucide-react';
import { useRole } from '../contexts/RoleContext';
import { clsx } from "clsx";
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
            return sale.salesPerson === currentUser;
        }
        if (role === 'customer') {
            return sale.customerName === currentUser;
        }
        return true;
    });

    const handleShip = async (id: string) => {
        const saleToShip = sales.find(s => s.id === id);
        if (!saleToShip) return;

        if (confirm("Kargolandı olarak işaretlemek istiyor musunuz?")) {
            const waybill = prompt("İrsaliye Numarası giriniz:");
            if (waybill) {
                await shipSale(id, saleToShip.quantity, waybill); // Full shipment
            }
        }
    };

    const showTotal = role !== 'warehouse';
    const showProfit = role === 'admin' || role === 'accountant';
    const showShippingActions = role === 'warehouse' || role === 'admin';

    return (
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold text-foreground">Satış Kayıtları</h2>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                        <input
                            type="text"
                            placeholder="Ara..."
                            className="bg-secondary/30 border border-border/50 text-foreground placeholder:text-muted-foreground rounded-md pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-primary/50 outline-none w-full sm:w-64 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="text-muted-foreground bg-secondary/20 border-b border-border/50 uppercase font-medium tracking-wide">
                        <tr>
                            <th className="px-4 py-3 font-medium">Tarih</th>
                            <th className="px-4 py-3 font-medium">Kod</th>
                            <th className="px-4 py-3 font-medium">Bölge / Şehir</th>
                            <th className="px-4 py-3 font-medium">Satış Personeli</th>
                            <th className="px-4 py-3 font-medium">Müşteri</th>
                            <th className="px-4 py-3 font-medium">Ürün</th>
                            {showTotal && <th className="px-4 py-3 font-medium text-right">Toplam</th>}
                            {showProfit && <th className="px-4 py-3 font-medium text-right">Kar</th>}
                            <th className="px-4 py-3 font-medium text-center">Durum</th>
                            {showShippingActions && <th className="px-4 py-3 font-medium text-center">Kargo</th>}
                            <th className="px-4 py-3 font-medium text-center">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {filteredSales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-secondary/10 transition-colors group">
                                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{sale.date}</td>
                                <td className="px-4 py-3 font-mono text-primary/80">{sale.storeCode}</td>
                                <td className="px-4 py-3 text-foreground">
                                    <div className="flex flex-col">
                                        <span>{sale.city}</span>
                                        <span className="text-[10px] text-muted-foreground">{sale.storeName}, {sale.region}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-secondary-foreground">{sale.salesPerson}</td>
                                <td className="px-4 py-3 text-secondary-foreground">
                                    <div className="flex flex-col">
                                        <span>{sale.customerName || '-'}</span>
                                        {sale.customerContact && (
                                            <span className="text-[10px] text-muted-foreground">{sale.customerContact}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="text-foreground font-medium">{sale.item}</span>
                                        <div className="flex gap-2 text-[10px] text-muted-foreground">
                                            <span>{sale.quantity} Adet</span>
                                        </div>
                                    </div>
                                </td>
                                {showTotal && (
                                    <td className="px-4 py-3 text-right font-medium text-foreground">
                                        {sale.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                    </td>
                                )}
                                {showProfit && (
                                    <td className="px-4 py-3 text-right text-green-600/90 font-medium">
                                        {(sale.total * 0.2).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                    </td>
                                )}
                                <td className="px-4 py-3 text-center">
                                    <span className={clsx(
                                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                                        sale.status === 'APPROVED' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                            sale.status === 'PENDING' ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                                sale.status === 'REJECTED' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                    "bg-secondary text-muted-foreground border-border"
                                    )}>
                                        {sale.status === 'APPROVED' ? 'Onaylandı' :
                                            sale.status === 'PENDING' ? 'Bekliyor' :
                                                sale.status === 'REJECTED' ? 'Reddedildi' : 'Bilinmiyor'}
                                    </span>
                                </td>
                                {showShippingActions && (
                                    <td className="px-4 py-3 text-center">
                                        {sale.isShipped ? (
                                            <div className="flex justify-center" title="Kargolandı">
                                                <div className="bg-green-100 text-green-600 p-1 rounded-full">
                                                    <CheckCircle size={14} />
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => sale.id && handleShip(sale.id)}
                                                title="Kargola"
                                                className="p-1.5 bg-secondary hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-md transition-colors"
                                            >
                                                <Truck size={14} />
                                            </button>
                                        )}
                                    </td>
                                )}
                                <td className="px-4 py-3 text-center">
                                    <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
                                        <MoreHorizontal size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="px-4 py-2 border-t border-border/50 bg-secondary/10 flex justify-between items-center text-[10px] text-muted-foreground">
                <span>Toplam {filteredSales.length} kayıt</span>
                <div className="flex gap-1">
                    <button disabled className="px-2 py-1 rounded hover:bg-secondary/50 disabled:opacity-50">Önceki</button>
                    <button className="px-2 py-1 rounded hover:bg-secondary/50">Sonraki</button>
                </div>
            </div>
        </div>
    );
}
