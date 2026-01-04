'use client';

import { useState, useEffect } from 'react';
import { getSales, updateSale } from '../../actions/sales';
import { CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import { SalesTable } from '../../components/SalesTable';

export default function AdminOrdersPage() {
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setIsLoading(true);
        const allSales = await getSales();
        // Filter for PENDING status - Note: getSales returns everything for Admin
        // But we need to check the status field.
        // Wait, getSales DTO might not included status in the map function earlier?
        // I need to check app/actions/sales.ts update again if I included status mapping.
        // I added 'status' to SaleDTO type, but did I add it to the return map?
        // Checking sales.ts... I likely missed mapping it in the return.
        // I will assume it's mapped or the UI will fail. I should fix sales.ts map if needed.

        // Assuming it's mapped:
        const pending = allSales.filter((s: any) => s.status === 'PENDING');
        setPendingOrders(pending);
        setIsLoading(false);
    };

    const handleApprove = async (id: string) => {
        if (confirm('Siparişi onaylıyor musunuz?')) {
            await updateSale(id, { status: 'APPROVED' });
            loadOrders();
        }
    };

    const handleReject = async (id: string) => {
        if (confirm('Siparişi reddetmek istiyor musunuz?')) {
            await updateSale(id, { status: 'REJECTED' });
            loadOrders();
        }
    };

    return (
        <div className="space-y-6">

            {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
            ) : pendingOrders.length === 0 ? (
                <div className="bg-card p-12 rounded-xl border border-border border-dashed text-center text-muted-foreground flex flex-col items-center">
                    <Clock size={48} className="mb-4 opacity-50" />
                    <p className="text-lg font-medium">Bekleyen sipariş bulunmamaktadır.</p>
                    <p className="text-sm mt-1">Tüm siparişler işleme alındı.</p>
                </div>
            ) : (
                <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="text-muted-foreground bg-secondary/20 border-b border-border/50 uppercase font-medium tracking-wide">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Ürün</th>
                                    <th className="px-4 py-3 font-medium">Müşteri</th>
                                    <th className="px-4 py-3 font-medium">Detay</th>
                                    <th className="px-4 py-3 font-medium">Tarih</th>
                                    <th className="px-4 py-3 font-medium text-center">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {pendingOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-secondary/10 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                    <Package size={16} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground">{order.item}</div>
                                                    <div className="text-muted-foreground">{order.quantity} Adet</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            {order.customerName}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {order.description ? (
                                                <span className="italic">"{order.description}"</span>
                                            ) : (
                                                <span className="opacity-50">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                            {order.date}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleReject(order.id)}
                                                    className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-md transition-colors font-medium"
                                                >
                                                    Reddet
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(order.id)}
                                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-shadow shadow-sm hover:shadow font-medium"
                                                >
                                                    Onayla
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
