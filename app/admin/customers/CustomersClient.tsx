'use client';

import React, { useState, useRef } from 'react';
import { createCustomer, deleteCustomer, updateCustomer, CustomerDTO } from '../../actions/customers';
import { importChecklistData } from '../../actions/import-legacy';
import { Plus, Upload, Search, MoreHorizontal, Building2, MapPin, Trash2, Edit } from 'lucide-react';

interface CustomersClientProps {
    initialCustomers: any[];
}

export function CustomersClient({ initialCustomers }: CustomersClientProps) {
    const [customers, setCustomers] = useState(initialCustomers);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<CustomerDTO | null>(null);

    // Hidden file input ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = async () => {
        if (!confirm('Excel dosyasından Müşteriler ve Satışlar senkronize edilecek. Bu işlem verileri günceller. Devam edilsin mi?')) return;

        const password = prompt('Lütfen işlem şifresini giriniz:');
        if (password !== '3987') {
            alert('Hatalı şifre. İşlem iptal edildi.');
            return;
        }

        // Trigger file selection
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const result = await importChecklistData(formData);
            if (result.success) {
                alert(result.message);
                window.location.reload();
            } else {
                alert('İçe aktarma hatası: ' + (result as any).message);
            }
        } catch (error) {
            alert('Bir hata oluştu: ' + (error as any).message);
        } finally {
            setIsLoading(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) {
            const result = await deleteCustomer(id);
            if (result.success) {
                window.location.reload();
            } else {
                alert('Silme başarısız: ' + (result as any).error);
            }
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.city || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Müşteri Yönetimi</h1>
                    <p className="text-muted-foreground">Müşteri listesi ve detayları</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={handleImportClick}
                        disabled={isLoading}
                        className="bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Upload size={18} />
                        {isLoading ? 'Yükleniyor...' : 'Excel\'den Aktar'}
                    </button>
                    <button
                        onClick={() => {
                            setEditingCustomer(null);
                            setIsFormOpen(true);
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        Yeni Müşteri
                    </button>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Müşteri ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-secondary/50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-secondary/30 text-muted-foreground font-semibold">
                            <tr>
                                <th className="px-6 py-4">Müşteri Adı</th>
                                <th className="px-6 py-4">Şehir</th>
                                <th className="px-6 py-4">İletişim</th>
                                <th className="px-6 py-4">Mağaza Kodu</th>
                                <th className="px-6 py-4 text-center">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        Kayıtlı müşteri bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-secondary/10 transition-colors">
                                        <td className="px-6 py-4 font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                                    <Building2 size={18} />
                                                </div>
                                                {customer.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {customer.city && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} />
                                                    {customer.city}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            <div className="flex flex-col">
                                                <span>{customer.contactName || '-'}</span>
                                                <span className="text-xs">{customer.phone} {customer.email && `• ${customer.email}`}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{customer.storeCode || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingCustomer(customer);
                                                        setIsFormOpen(true);
                                                    }}
                                                    className="p-2 bg-secondary/50 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                                    title="Düzenle"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer.id)}
                                                    className="p-2 bg-secondary/50 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                    title="Sil"
                                                >
                                                    <Trash2 size={16} />
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
                <CustomerForm
                    customer={editingCustomer}
                    onClose={() => setIsFormOpen(false)}
                />
            )}
        </div>
    );
}

// Removed duplicate imports
import { X } from 'lucide-react';

function CustomerForm({ customer, onClose }: { customer: CustomerDTO | null, onClose: () => void }) {
    const isEditing = !!customer;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const formData = new FormData(form);

        const data: CustomerDTO = {
            name: formData.get('name') as string,
            city: formData.get('city') as string,
            storeCode: formData.get('storeCode') as string,
            contactName: formData.get('contactName') as string,
            phone: formData.get('phone') as string,
            email: formData.get('email') as string,
        };

        if (isEditing && customer?.id) {
            await updateCustomer(customer.id, data);
        } else {
            await createCustomer(data);
        }

        // Simple reload to refresh data
        window.location.reload();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-xl">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-foreground">
                        {isEditing ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
                    </h2>
                    <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Müşteri / Mağaza Adı</label>
                            <input name="name" defaultValue={customer?.name} required className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Şehir</label>
                                <input name="city" defaultValue={customer?.city} className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mağaza Kodu</label>
                                <input name="storeCode" defaultValue={customer?.storeCode} className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">İlgili Kişi</label>
                            <input name="contactName" defaultValue={customer?.contactName} className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Telefon</label>
                                <input name="phone" defaultValue={customer?.phone} className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">E-posta</label>
                                <input name="email" type="email" defaultValue={customer?.email} className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none" />
                            </div>
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
