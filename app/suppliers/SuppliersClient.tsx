'use client';

import { useState } from 'react';
import { SupplierDTO, createSupplier, updateSupplier, deleteSupplier, getSupplierProducts } from '../actions/suppliers';
import { useRole } from '../contexts/RoleContext';
import { Plus, Search, Edit, Trash2, Phone, Mail, User, List, X } from 'lucide-react';

interface SuppliersClientProps {
    initialSuppliers: SupplierDTO[];
}

export default function SuppliersClient({ initialSuppliers }: SuppliersClientProps) {
    const { role } = useRole();
    const [suppliers, setSuppliers] = useState(initialSuppliers);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<SupplierDTO | null>(null);

    // Product List Modal State
    const [productsModal, setProductsModal] = useState<{ isOpen: boolean, products: any[], supplierName: string, isLoading: boolean }>({
        isOpen: false, products: [], supplierName: '', isLoading: false
    });

    // Form State
    const [name, setName] = useState('');
    const [contactName, setContactName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');

    const filteredSuppliers = initialSuppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.contactName && s.contactName.toLowerCase().includes(search.toLowerCase()))
    );

    const handleOpenModal = (supplier?: SupplierDTO) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setName(supplier.name);
            setContactName(supplier.contactName || '');
            setEmail(supplier.email || '');
            setPhone(supplier.phone || '');
        } else {
            setEditingSupplier(null);
            setName('');
            setContactName('');
            setEmail('');
            setPhone('');
        }
        setError('');
        setIsModalOpen(true);
    };

    const handleShowProducts = async (supplier: SupplierDTO) => {
        setProductsModal({ isOpen: true, products: [], supplierName: supplier.name, isLoading: true });
        const products = await getSupplierProducts(supplier.id);
        setProductsModal({ isOpen: true, products, supplierName: supplier.name, isLoading: false });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (editingSupplier) {
            const result = await updateSupplier(editingSupplier.id, { name, contactName, email, phone });
            if (!result.success) {
                setError(result.error || 'Güncelleme başarısız');
                return;
            }
        } else {
            const result = await createSupplier({ name, contactName, email, phone });
            if (!result.success) {
                setError(result.error || 'Oluşturma başarısız');
                return;
            }
        }

        setIsModalOpen(false);
        // Optimistic update or wait for revalidate (auto refresh via props)
        window.location.reload();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu tedarikçiyi silmek istediğinize emin misiniz?')) return;

        const result = await deleteSupplier(id);
        if (result.success) {
            window.location.reload();
        } else {
            alert('Silme başarısız');
        }
    };

    if (role !== 'admin') {
        return <div className="p-4 text-center text-muted-foreground">Yetkiniz yok.</div>;
    }

    return (
        <div className="space-y-4 p-4">
            <div className="flex justify-between items-center bg-card p-3 rounded-lg border border-border">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    Tedarikçiler
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground font-normal">
                        {filteredSuppliers.length}
                    </span>
                </h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    <Plus size={16} /> Yeni Ekle
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                    type="text"
                    placeholder="Tedarikçi ara..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg focus:ring-1 focus:ring-primary outline-none"
                />
            </div>

            {/* List -> Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left compact-table">
                        <thead className="bg-secondary/50 text-muted-foreground font-medium border-b border-border text-[10px] uppercase">
                            <tr>
                                <th className="px-3 py-2">Tedarikçi Adı</th>
                                <th className="px-3 py-2">İlgili Kişi</th>
                                <th className="px-3 py-2">Telefon</th>
                                <th className="px-3 py-2">E-posta</th>
                                <th className="px-3 py-2 text-center">Ürün Sayısı</th>
                                <th className="px-3 py-2 w-20">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredSuppliers.map(supplier => (
                                <tr key={supplier.id} className="hover:bg-secondary/20 transition-colors h-8">
                                    <td className="px-3 py-1 font-medium">{supplier.name}</td>
                                    <td className="px-3 py-1 text-muted-foreground">{supplier.contactName || '-'}</td>
                                    <td className="px-3 py-1 text-muted-foreground">{supplier.phone || '-'}</td>
                                    <td className="px-3 py-1 text-muted-foreground">{supplier.email || '-'}</td>
                                    <td className="px-3 py-1 text-center font-mono">{supplier.productCount || 0}</td>
                                    <td className="px-3 py-1">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => handleShowProducts(supplier)} className="p-1 hover:bg-secondary rounded-md text-amber-500 transition-colors" title="Ürünleri Listele">
                                                <List size={14} />
                                            </button>
                                            <button onClick={() => handleOpenModal(supplier)} className="p-1 hover:bg-secondary rounded-md text-blue-500 transition-colors">
                                                <Edit size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(supplier.id)} className="p-1 hover:bg-secondary rounded-md text-red-500 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredSuppliers.length === 0 && (
                                <tr key="no-data">
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        Tedarikçi bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Products Modal */}
            {productsModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-2xl rounded-xl border border-border shadow-xl p-6 overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {productsModal.supplierName}
                                <span className="text-sm font-normal text-muted-foreground">({productsModal.products.length} ürün)</span>
                            </h2>
                            <button onClick={() => setProductsModal(prev => ({ ...prev, isOpen: false }))}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {productsModal.isLoading ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">Yükleniyor...</div>
                            ) : productsModal.products.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">Bu tedarikçiye ait ürün bulunamadı.</div>
                            ) : (
                                <table className="w-full text-sm text-left compact-table">
                                    <thead className="bg-secondary/50 text-muted-foreground sticky top-0 text-[10px] uppercase">
                                        <tr>
                                            <th className="px-3 py-2">Kod</th>
                                            <th className="px-3 py-2">Ürün Adı</th>
                                            <th className="px-3 py-2 text-right">Fiyat</th>
                                            <th className="px-3 py-2 text-right">Maliyet</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {productsModal.products.map((p: any) => (
                                            <tr key={p.id} className="hover:bg-secondary/20">
                                                <td className="px-3 py-1 font-mono text-xs">{p.productNumber || '-'}</td>
                                                <td className="px-3 py-1">{p.name}</td>
                                                <td className="px-3 py-1 text-right font-mono">{p.price?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                                                <td className="px-3 py-1 text-right text-muted-foreground font-mono">{p.cost?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setProductsModal(prev => ({ ...prev, isOpen: false }))}
                                className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-xl p-6">
                        <h2 className="text-xl font-bold mb-4">{editingSupplier ? 'Tedarikçi Düzenle' : 'Yeni Tedarikçi'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Tedarikçi Adı</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full mt-1 p-2 bg-secondary/50 border border-border rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">İlgili Kişi</label>
                                <input
                                    type="text"
                                    value={contactName}
                                    onChange={(e) => setContactName(e.target.value)}
                                    className="w-full mt-1 p-2 bg-secondary/50 border border-border rounded-lg"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium">Telefon</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full mt-1 p-2 bg-secondary/50 border border-border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">E-posta</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full mt-1 p-2 bg-secondary/50 border border-border rounded-lg"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-sm text-red-500">{error}</p>}

                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm hover:bg-secondary rounded-lg"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 text-sm bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
