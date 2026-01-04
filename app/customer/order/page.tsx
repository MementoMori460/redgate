'use client';

import { useState } from 'react';
import { createSale } from '../../actions/sales';
import { useRole } from '../../contexts/RoleContext';
import { ShoppingBag, Send } from 'lucide-react';

export default function CustomerOrderPage() {
    const { role, currentUser } = useRole();
    const [formData, setFormData] = useState({
        item: '',
        quantity: 1,
        description: '' // Optional description
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (role !== 'customer') {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-500">Yetkisiz Erişim</h1>
                <p>Bu sayfayı sadece müşteriler görüntüleyebilir.</p>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Mocking some data since we don't have full product/price DB yet
            const result = await createSale({
                date: new Date().toISOString(),
                storeCode: 'ONLINE',
                region: 'Online',
                city: 'Online', // Should come from Customer Profile
                storeName: 'Online Store',
                salesPerson: 'Online Sistem', // System user
                customerName: currentUser, // The logged in customer
                item: formData.item,
                price: 0, // Pending quote
                quantity: formData.quantity,
                total: 0,
                profit: 0,
                isShipped: false,
                status: 'PENDING',
                description: formData.description
            });

            if (result.success) {
                alert('Siparişiniz alındı! Onay sürecinde.');
                setFormData({ item: '', quantity: 1, description: '' });
            } else {
                alert('Sipariş oluşturulurken hata oluştu.');
            }
        } catch (error) {
            console.error(error);
            alert('Bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 p-6">
            <div className="bg-card border border-border/50 rounded-xl p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <ShoppingBag size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Yeni Sipariş Oluştur</h1>
                        <p className="text-muted-foreground">İhtiyacınız olan ürünleri buradan talep edebilirsiniz.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Ürün / Hizmet Adı</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                            placeholder="Örn: Karton Bardak"
                            value={formData.item}
                            onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Adet</label>
                        <input
                            type="number"
                            min="1"
                            required
                            className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Açıklama (Opsiyonel)</label>
                        <textarea
                            className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none min-h-[100px]"
                            placeholder="Varsa ek istekleriniz..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            'Gönderiliyor...'
                        ) : (
                            <>
                                <Send size={18} /> Siparişi Gönder
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
