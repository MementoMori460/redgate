'use client';

import { useState, useEffect } from 'react';
import { createSale } from '../../actions/sales';
import { getProducts, ProductDTO } from '../../actions/products';
import { getCustomerProfile } from '../../actions/customers';
import { useRole } from '../../contexts/RoleContext';
import { ShoppingBag, Send, Search, Package } from 'lucide-react';

export default function CustomerOrderPage() {
    const { role, currentUser } = useRole();
    const [products, setProducts] = useState<ProductDTO[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ProductDTO[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [customerProfile, setCustomerProfile] = useState<any>(null);

    const [formData, setFormData] = useState({
        item: '',
        quantity: 1,
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (role === 'customer' && currentUser) {
            getProducts().then(allProducts => {
                setProducts(allProducts);
                setFilteredProducts(allProducts);
            });
            getCustomerProfile(currentUser).then(profile => {
                if (profile) setCustomerProfile(profile);
            });
        }
    }, [role, currentUser]);

    useEffect(() => {
        const filtered = products.filter(p =>
            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            (p.productNumber || '').toLowerCase().includes(productSearch.toLowerCase())
        );
        setFilteredProducts(filtered);
    }, [productSearch, products]);

    const handleSelectProduct = (productName: string) => {
        setFormData(prev => ({ ...prev, item: productName }));
        // Smooth scroll to form
        document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const result = await createSale({
                date: new Date().toISOString(),
                storeCode: customerProfile?.storeCode || 'ONLINE',
                region: customerProfile?.region || 'Online',
                city: customerProfile?.city || 'Online',
                storeName: customerProfile?.storeName || 'Online Store', // Store name might not be in profile directly?
                salesPerson: 'Online Sistem',
                customerName: currentUser || '',
                item: formData.item,
                price: 0, // Quote pending
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

    if (role !== 'customer') {
        return (
            <div className="p-8 text-center text-red-500 font-bold">
                Bu sayfaya sadece müşteriler erişebilir.
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                    <ShoppingBag size={32} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Sipariş Oluştur</h1>
                    <p className="text-muted-foreground">İhtiyaçlarınızı listeden seçerek veya form üzerinden sipariş verin.</p>
                </div>
            </div>

            {/* Product List Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Package size={20} className="text-primary" /> Ürün Listesi
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                        <input
                            type="text"
                            placeholder="Ürün Ara..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="bg-card border border-border/50 rounded-lg pl-9 pr-4 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary/50"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-card border border-border/50 rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col justify-between gap-3">
                            <div>
                                <h3 className="font-medium text-foreground">{product.name}</h3>
                                {product.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{product.description}</p>}
                                <div className="text-xs font-mono text-muted-foreground mt-2">{product.productNumber}</div>
                            </div>
                            <button
                                onClick={() => handleSelectProduct(product.name)}
                                className="text-xs font-medium bg-secondary/50 hover:bg-primary hover:text-white px-3 py-2 rounded-md transition-colors w-full"
                            >
                                Seç ve Sipariş Ver
                            </button>
                        </div>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full text-center py-8 text-muted-foreground text-sm">Ürün bulunamadı.</div>
                    )}
                </div>
            </div>

            {/* Order Form */}
            <div id="order-form" className="bg-card border border-border/50 rounded-xl p-8 shadow-sm">
                <h2 className="text-lg font-bold mb-6 border-b border-border/50 pb-2">Sipariş Detayları</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Seçilen Ürün</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none font-medium"
                            placeholder="Listeden seçin veya yazın..."
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

                    <div className="bg-secondary/10 p-4 rounded-lg text-sm text-muted-foreground mb-4">
                        <p><strong>Teslimat Bilgisi:</strong> {customerProfile ? `${customerProfile.city || ''} ${customerProfile.region ? '/ ' + customerProfile.region : ''}` : 'Profil yükleniyor...'}</p>
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
                                <Send size={18} /> Siparişi Tamamla
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
