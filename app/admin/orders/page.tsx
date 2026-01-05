'use client';

import { useState, useEffect } from 'react';
import { getPendingOrders, updateSale, checkAndCleanupOldOrders } from '../../actions/sales';
import { Clock, Package } from 'lucide-react';
import { ConfirmationModal } from '../../components/ConfirmationModal';

export default function AdminOrdersPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        action: 'approve' | 'reject' | null;
        id: string | null;
    }>({
        isOpen: false,
        action: null,
        id: null
    });

    useEffect(() => {
        const init = async () => {
            // First run cleanup
            const cleanup = await checkAndCleanupOldOrders();
            if (cleanup.count > 0) {
                // Use a non-blocking notification or just log it instead of alert to avoid blocking UI on load
                console.log(`${cleanup.count} adet eski sipariş temizlendi.`);
            }

            // Then fetch pending orders
            const pendingSales = await getPendingOrders();
            setSales(pendingSales);
            setLoading(false);
        };
        init();
    }, []);

    const handleActionClick = (id: string, action: 'approve' | 'reject') => {
        setConfirmModal({
            isOpen: true,
            action,
            id
        });
    };

    const handleConfirmAction = async () => {
        if (!confirmModal.id || !confirmModal.action) return;

        const { id, action } = confirmModal;
        const status = action === 'approve' ? 'APPROVED' : 'REJECTED';

        await updateSale(id, { status });

        // Reload
        const updatedSales = await getPendingOrders();
        setSales(updatedSales);

        setConfirmModal({ isOpen: false, action: null, id: null });
    };

    return (
        <div className="space-y-6">

            {loading ? (
                <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
            ) : sales.length === 0 ? (
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
                                {sales.map((order) => (
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
                                                    onClick={() => handleActionClick(order.id, 'reject')}
                                                    className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-md transition-colors font-medium"
                                                >
                                                    Reddet
                                                </button>
                                                <button
                                                    onClick={() => handleActionClick(order.id, 'approve')}
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

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={confirmModal.action === 'approve' ? 'Siparişi Onayla' : 'Siparişi Reddet'}
                message={
                    confirmModal.action === 'approve'
                        ? 'Bu siparişi onaylamak istediğinize emin misiniz?'
                        : 'Bu siparişi reddetmek istediğinize emin misiniz? Bu işlem geri alınamaz.'
                }
                confirmText={confirmModal.action === 'approve' ? 'Onayla' : 'Reddet'}
                isDangerous={confirmModal.action === 'reject'}
                icon={confirmModal.action === 'approve' ? 'question' : 'alert'}
            />
        </div>
    );
}
