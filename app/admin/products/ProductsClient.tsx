'use client';

import { useState } from 'react';
import { ProductDTO, createProduct, updateProduct, deleteProduct } from '@/app/actions/products';
import { Plus, Search, Edit2, Trash2, X, Loader2, Save, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ConfirmationModal } from '@/app/components/ConfirmationModal';

interface ProductsClientProps {
    initialProducts: ProductDTO[];
}

export function ProductsClient({ initialProducts }: ProductsClientProps) {
    const [products, setProducts] = useState(initialProducts);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductDTO | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.productNumber || '').toLowerCase().includes(search.toLowerCase())
    );



    const handleDeleteClick = (id: string) => {
        setDeleteModal({ isOpen: true, id });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.id) return;

        setIsLoading(true);
        const result = await deleteProduct(deleteModal.id);
        if (result.success) {
            router.refresh();
            setProducts(products.filter(p => p.id !== deleteModal.id));
            setDeleteModal({ isOpen: false, id: null });
        } else {
            alert('Silme işlemi başarısız oldu.');
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Ürün ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        Yeni Ürün
                    </button>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left compact-table">
                        <thead className="bg-secondary/50 text-muted-foreground font-medium border-b border-border text-[10px] uppercase">
                            <tr>
                                <th className="px-3 py-2">Ürün Kodu</th>
                                <th className="px-3 py-2">Ürün Adı</th>
                                <th className="px-3 py-2 text-right">Fiyat</th>
                                <th className="px-3 py-2 text-right">Maliyet</th>
                                <th className="px-3 py-2 w-20">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-secondary/20 transition-colors h-8">
                                    <td className="px-3 py-1 font-mono text-[10px]">{product.productNumber}</td>
                                    <td className="px-3 py-1 font-medium">{product.name}</td>
                                    <td className="px-3 py-1 text-right">
                                        {product.price ? `${product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL` : '-'}
                                    </td>
                                    <td className="px-3 py-1 text-right text-muted-foreground">
                                        {product.cost ? `${product.cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL` : '-'}
                                    </td>
                                    <td className="px-3 py-1">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                                                className="p-1 hover:bg-secondary rounded-md text-blue-500 transition-colors"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(product.id || '')}
                                                className="p-1 hover:bg-secondary rounded-md text-red-500 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                        Ürün bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <ProductModal
                    product={editingProduct}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        router.refresh();
                        // Note: To fully sync state without full refresh, we'd pass the new product back, 
                        // but router.refresh() + key update or server refetch is simpler for now.
                        // Actually, let's just trigger a full page refresh for simplicity for now.
                        window.location.reload();
                    }}
                />
            )}

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={handleDeleteConfirm}
                title="Ürünü Sil"
                message="Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
                confirmText="Sil"
                isDangerous={true}
                isLoading={isLoading}
                icon="trash"
            />
        </div>
    );
}

function ProductModal({ product, onClose, onSuccess }: { product: ProductDTO | null, onClose: () => void, onSuccess: () => void }) {
    const [name, setName] = useState(product?.name || '');
    const [price, setPrice] = useState(product?.price?.toString() || '');
    const [cost, setCost] = useState(product?.cost?.toString() || '');
    const [productNumber, setProductNumber] = useState(product?.productNumber || '');
    const [description, setDescription] = useState(product?.description || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const data = {
            name,
            price: price ? parseFloat(price) : 0, // Ensure strictly number, 0 if empty/invalid
            cost: cost ? parseFloat(cost) : 0,
            productNumber: productNumber || undefined,
            description: description || null
        };

        let result;
        if (product && product.id) {
            // For update, productNumber is required (or we pass explicitly what we have)
            result = await updateProduct(product.id, {
                ...data,
                productNumber: productNumber || product.productNumber // Fallback shouldn't happen if validation works, but safe
            });
        } else {
            result = await createProduct(data);
        }

        if (result.success) {
            onSuccess();
        } else {
            alert(result.error || 'İşlem başarısız.');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-md rounded-xl shadow-xl border border-border animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold text-lg">
                        {product ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                    </h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Ürün Kodu</label>
                        <input
                            type="text"
                            value={productNumber}
                            onChange={(e) => setProductNumber(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-secondary/20 focus:ring-2 focus:ring-primary/50 outline-none"
                            placeholder={product ? '' : 'Otomatik (Boş bırakınız)'}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Ürün Adı</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-secondary/20 focus:ring-2 focus:ring-primary/50 outline-none"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Fiyat (TL)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-secondary/20 focus:ring-2 focus:ring-primary/50 outline-none"
                                placeholder="Opsiyonel"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Maliyet (TL)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-secondary/20 focus:ring-2 focus:ring-primary/50 outline-none"
                                placeholder="Opsiyonel"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Açıklama / Not</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-secondary/20 focus:ring-2 focus:ring-primary/50 outline-none resize-none h-20"
                            placeholder="Ürün hakkında not..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </form>
            </div>
        </div>
    );
}
