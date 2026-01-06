'use client';

import React, { useState } from 'react';
import { createStore, updateStore, deleteStore, StoreDTO } from '../../actions/stores';
import { Plus, Search, MapPin, Trash2, Edit, X, Building, Download } from 'lucide-react';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { useRole } from '../../contexts/RoleContext';

interface StoresClientProps {
    initialStores: any[];
}

export function StoresClient({ initialStores }: StoresClientProps) {
    const { role } = useRole();
    const [stores, setStores] = useState(initialStores);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<StoreDTO | null>(null);

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
    const [isDeleting, setIsDeleting] = useState(false);

    const filteredStores = stores.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExport = () => {
        if (!filteredStores.length) return;

        const headers = ["Kod", "Mağaza Adı", "Bölge", "Şehir"];
        const csvContent = [
            headers.join(','),
            ...filteredStores.map(s => [
                `"${s.code}"`,
                `"${s.name}"`,
                `"${s.region}"`,
                `"${s.city}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `magazalar_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDeleteClick = (id: string) => {
        setDeleteModal({ isOpen: true, id });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.id) return;

        setIsDeleting(true);
        const result = await deleteStore(deleteModal.id);
        if (result.success) {
            window.location.reload();
        } else {
            alert('Silme başarısız');
            setIsDeleting(false);
            setDeleteModal({ isOpen: false, id: null });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-2 ml-auto">
                    {role === 'admin' && (
                        <button
                            onClick={handleExport}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Download size={18} />
                            İndir
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setEditingStore(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        Yeni Mağaza
                    </button>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Mağaza, şehir veya kod ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-secondary/50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left compact-table">
                        <thead className="text-[10px] uppercase bg-secondary/30 text-muted-foreground font-semibold">
                            <tr>
                                <th className="px-3 py-2">Kod</th>
                                <th className="px-3 py-2">Mağaza Adı</th>
                                <th className="px-3 py-2">Bölge</th>
                                <th className="px-3 py-2">Şehir</th>
                                <th className="px-3 py-2 text-center">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredStores.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                        Kayıt bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                filteredStores.map((store) => (
                                    <tr key={store.id} className="hover:bg-secondary/10 transition-colors h-8">
                                        <td className="px-3 py-1 font-mono font-bold text-[10px]">{store.code}</td>
                                        <td className="px-3 py-1 font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-primary/10 p-1 rounded text-primary">
                                                    <Building size={14} />
                                                </div>
                                                {store.name}
                                            </div>
                                        </td>
                                        <td className="px-3 py-1 text-muted-foreground">{store.region}</td>
                                        <td className="px-3 py-1 text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <MapPin size={12} />
                                                {store.city}
                                            </div>
                                        </td>
                                        <td className="px-3 py-1 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditingStore(store);
                                                        setIsFormOpen(true);
                                                    }}
                                                    className="p-1 bg-secondary/50 rounded hover:text-primary hover:bg-primary/10 transition-all"
                                                    title="Düzenle"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(store.id)}
                                                    className="p-1 bg-secondary/50 rounded hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                    title="Sil"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isFormOpen && (
                <StoreForm
                    store={editingStore}
                    onClose={() => setIsFormOpen(false)}
                />
            )}

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={handleDeleteConfirm}
                title="Mağazayı Sil"
                message="Bu mağazayı silmek istediğinize emin misiniz?"
                confirmText="Sil"
                isDangerous={true}
                isLoading={isDeleting}
                icon="trash"
            />
        </div>
    );
}

function StoreForm({ store, onClose }: { store: StoreDTO | null, onClose: () => void }) {
    const isEditing = !!store;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const formData = new FormData(form);

        const data: StoreDTO = {
            code: formData.get('code') as string,
            name: formData.get('name') as string,
            city: formData.get('city') as string,
            region: formData.get('region') as string,
        };

        if (isEditing && store?.id) {
            await updateStore(store.id, data);
        } else {
            await createStore(data);
        }

        window.location.reload();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-xl">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-foreground">
                        {isEditing ? 'Mağaza Düzenle' : 'Yeni Mağaza Ekle'}
                    </h2>
                    <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mağaza Kodu</label>
                                <input name="code" defaultValue={store?.code} required className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Şehir</label>
                                <input name="city" defaultValue={store?.city} required className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mağaza Adı</label>
                            <input name="name" defaultValue={store?.name} required className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Bölge</label>
                            <select name="region" defaultValue={store?.region || 'Marmara'} className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none">
                                <option value="Marmara">Marmara</option>
                                <option value="Ege Akdeniz">Ege Akdeniz</option>
                                <option value="Anadolu">Anadolu</option>
                            </select>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg font-medium text-muted-foreground hover:bg-secondary transition-colors">
                                İptal
                            </button>
                            <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-primary/25 transition-all">
                                Kaydet
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
