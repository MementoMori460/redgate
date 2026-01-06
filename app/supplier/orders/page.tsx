'use client';

import { useState, useEffect } from 'react';
import { getSupplierOrders } from '@/app/actions/sales'; // We will use generic SaleDTO or specific return type
import { Download, Truck } from 'lucide-react';

// Define a type for what getSupplierOrders returns
// It is essentially SaleDTO but simplified/masked.
type SupplierOrder = {
    id: string
    date: string
    orderNumber: string
    customerName: string
    item: string
    quantity: number
    status: string
    waybillNumber: string
    isShipped: boolean
}

export default function SupplierOrdersPage() {
    const [orders, setOrders] = useState<SupplierOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const data = await getSupplierOrders();
            setOrders(data as any);
        } catch (error) {
            console.error("Failed to load orders", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!orders.length) return;

        const headers = ["Sipariş No", "Tarih", "Müşteri", "Ürün", "Adet", "Durum", "Takip No"];
        const csvContent = [
            headers.join(','),
            ...orders.map(o => [
                `"${o.orderNumber}"`,
                `"${o.date}"`,
                `"${o.customerName}"`,
                `"${o.item}"`,
                `"${o.quantity}"`,
                `"${o.status}"`,
                `"${o.waybillNumber || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `siparislerim_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Gelen Siparişler</h1>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                >
                    <Download size={16} />
                    Excel/CSV İndir
                </button>
            </div>

            <div className="border rounded-lg overflow-hidden bg-card">
                <table className="w-full text-sm text-left">
                    <thead className="bg-secondary text-muted-foreground uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Sipariş No</th>
                            <th className="px-4 py-3">Tarih</th>
                            <th className="px-4 py-3">Müşteri</th>
                            <th className="px-4 py-3">Ürün</th>
                            <th className="px-4 py-3 text-right">Adet</th>
                            <th className="px-4 py-3">Durum</th>
                            <th className="px-4 py-3">Takip No</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                    Henüz siparişiniz yok.
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id} className="hover:bg-secondary/20 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-blue-500">{order.orderNumber}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{order.date}</td>
                                    <td className="px-4 py-3 font-medium">{order.customerName}</td>
                                    <td className="px-4 py-3">{order.item}</td>
                                    <td className="px-4 py-3 text-right font-mono">{order.quantity}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${order.status === 'SHIPPED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            order.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                'bg-secondary text-muted-foreground'
                                            }`}>
                                            {order.status === 'SHIPPED' ? 'Kargolandı' :
                                                order.status === 'PENDING' ? 'Bekliyor' : order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs font-mono">{order.waybillNumber || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
