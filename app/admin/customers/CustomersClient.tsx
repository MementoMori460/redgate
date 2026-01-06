'use client';

import React, { useState, useRef } from 'react';
import { createCustomer, deleteCustomer, updateCustomer, CustomerDTO, importCustomersFromExcel } from '../../actions/customers';
import { Plus, Upload, Search, MoreHorizontal, Building2, MapPin, Trash2, Edit, Download } from 'lucide-react';
import { ConfirmationModal } from '@/app/components/ConfirmationModal';
import { useRole } from '../../contexts/RoleContext';

interface CustomersClientProps {
    initialCustomers: any[];
}

export function CustomersClient({ initialCustomers }: CustomersClientProps) {
    const [customers, setCustomers] = useState(initialCustomers);
    const { role } = useRole();
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<CustomerDTO | null>(null);
    const [importConfirmOpen, setImportConfirmOpen] = useState(false);

    // Delete Modal State
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<CustomerDTO | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Hidden file input ref (moved file reading logic to after confirm)
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        if (!filteredCustomers.length) return;

        const headers = ["Müşteri Adı", "Şehir", "İletişim/Unvan", "Telefon", "E-posta", "Mağaza Kodu"];
        const csvContent = [
            headers.join(','),
            ...filteredCustomers.map(c => [
                `"${c.name}"`,
                `"${c.city || ''}"`,
                `"${c.contactName || ''}"`,
                `"${c.phone || ''}"`,
                `"${c.email || ''}"`,
                `"${c.storeCode || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `musteriler_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportClick = () => {
        setImportConfirmOpen(true);
    };

    const handleImportConfirm = () => {
        setImportConfirmOpen(false);

        // Keep prompt for now or replace with better UI later if needed, but 'confirm' is gone.
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

            const result = await importCustomersFromExcel(formData);
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



    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.city || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'city' | 'storeCode', direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

    const handleSort = (key: 'name' | 'city' | 'storeCode') => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedCustomers = [...filteredCustomers].sort((a, b) => {
        const aValue = (a[sortConfig.key] || '').toString().toLowerCase();
        const bValue = (b[sortConfig.key] || '').toString().toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="hidden lg:block bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-lg">
                    <p className="text-xs text-blue-600">
                        <span className="font-bold">Not:</span> Müşterilerin sisteme giriş şifreleri <a href="/admin/users" className="underline hover:text-blue-800">Kullanıcılar</a> sayfasından yönetilir.
                    </p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                    />
                    {role === 'admin' && (
                        <>
                            <button
                                onClick={handleExport}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Download size={18} />
                                İndir
                            </button>
                            <button
                                onClick={handleImportClick}
                                disabled={isLoading}
                                className="bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Upload size={18} />
                                {isLoading ? 'Yükleniyor...' : 'Excel\'den Aktar'}
                            </button>
                        </>
                    )}
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
                <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Müşteri ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-secondary/50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2 text-sm w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                        <span className="text-muted-foreground whitespace-nowrap">Sırala:</span>
                        <button
                            onClick={() => handleSort('name')}
                            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${sortConfig.key === 'name' ? 'bg-primary/10 text-primary font-medium' : 'bg-secondary/30 hover:bg-secondary/50'}`}
                        >
                            İsim {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </button>
                        <button
                            onClick={() => handleSort('city')}
                            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${sortConfig.key === 'city' ? 'bg-primary/10 text-primary font-medium' : 'bg-secondary/30 hover:bg-secondary/50'}`}
                        >
                            Şehir {sortConfig.key === 'city' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </button>
                        <button
                            onClick={() => handleSort('storeCode')}
                            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${sortConfig.key === 'storeCode' ? 'bg-primary/10 text-primary font-medium' : 'bg-secondary/30 hover:bg-secondary/50'}`}
                        >
                            Mağaza {sortConfig.key === 'storeCode' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left compact-table">
                        <thead className="text-[10px] uppercase bg-secondary/30 text-muted-foreground font-semibold">
                            <tr>
                                <th className="px-2 py-1.5">Müşteri Adı</th>
                                <th className="px-2 py-1.5">Şehir</th>
                                <th className="px-2 py-1.5">İletişim / Unvan</th>
                                <th className="px-2 py-1.5">Telefon</th>
                                <th className="px-2 py-1.5">E-posta</th>
                                <th className="px-2 py-1.5">Mağaza Kodu</th>
                                <th className="px-2 py-1.5 text-center">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {sortedCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                        Kayıtlı müşteri bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                sortedCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-secondary/10 transition-colors h-7">
                                        <td className="px-2 py-0.5 font-medium whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-primary/10 p-0.5 rounded text-primary">
                                                    <Building2 size={12} />
                                                </div>
                                                {customer.name}
                                            </div>
                                        </td>
                                        <td className="px-2 py-0.5 text-muted-foreground whitespace-nowrap">
                                            {customer.city && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin size={10} />
                                                    {customer.city}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-2 py-0.5 text-muted-foreground text-[10px] truncate max-w-[150px]" title={customer.contactName || ''}>
                                            {customer.contactName || '-'}
                                        </td>
                                        <td className="px-2 py-0.5 text-[10px] whitespace-nowrap">{customer.phone || '-'}</td>
                                        <td className="px-2 py-0.5 text-[10px] truncate max-w-[150px]" title={customer.email || ''}>
                                            {customer.email || '-'}
                                        </td>
                                        <td className="px-2 py-0.5 font-mono text-[10px] whitespace-nowrap">{customer.storeCode || '-'}</td>
                                        <td className="px-2 py-0.5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditingCustomer(customer);
                                                        setIsFormOpen(true);
                                                    }}
                                                    className="p-1 bg-secondary/50 rounded hover:text-primary hover:bg-primary/10 transition-all"
                                                    title="Düzenle"
                                                >
                                                    <Edit size={12} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCustomerToDelete(customer);
                                                        setDeleteConfirmationOpen(true);
                                                        setDeleteError(null);
                                                    }}
                                                    className="p-1 bg-secondary/50 rounded hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                    title="Sil"
                                                >
                                                    <Trash2 size={12} />
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

            {/* Delete Confirmation Modal */}
            {deleteConfirmationOpen && customerToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-sm rounded-xl border border-border shadow-2xl p-6 space-y-4">
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                                <Trash2 size={24} /> Müşteriyi Sil
                            </h3>
                            <p className="text-sm text-foreground">
                                <strong>{customerToDelete.name}</strong> müşterisini silmek istediğinize emin misiniz?
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Bu işlem geri alınamaz.
                            </p>
                        </div>
                        {deleteError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                {deleteError}
                            </div>
                        )}
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                onClick={() => {
                                    setDeleteConfirmationOpen(false);
                                    setCustomerToDelete(null);
                                    setDeleteError(null);
                                }}
                                className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-lg transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={async () => {
                                    setIsDeleting(true);
                                    setDeleteError(null);
                                    try {
                                        const result = await deleteCustomer(customerToDelete.id!);
                                        if (result.success) {
                                            setDeleteConfirmationOpen(false);
                                            window.location.reload();
                                        } else {
                                            setDeleteError(result.error || 'Silme işlemi başarısız');
                                        }
                                    } catch (err) {
                                        setDeleteError('Bir hata oluştu');
                                    } finally {
                                        setIsDeleting(false);
                                    }
                                }}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isDeleting ? 'Siliniyor...' : 'Sil'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={importConfirmOpen}
                onClose={() => setImportConfirmOpen(false)}
                onConfirm={handleImportConfirm}
                title="Müşteri Listesi İçe Aktar"
                message="Excel dosyasından Müşteri ve Mağaza bilgileri güncellenecek. (Satış verileri etkilenmez). Devam edilsin mi?"
                confirmText="Devam Et"
                icon="question"
            />
        </div>
    );
}

// Removed duplicate imports
import { X } from 'lucide-react';

function CustomerForm({ customer, onClose }: { customer: CustomerDTO | null, onClose: () => void }) {
    const isEditing = !!customer;
    const [storeCodes, setStoreCodes] = useState<{ code: string, name: string, city: string }[]>([]);

    React.useEffect(() => {
        import('../../actions/customers').then(({ getStoreCodes }) => {
            getStoreCodes().then(setStoreCodes);
        });
    }, []);

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
                                <label className="text-sm font-medium">Telefon</label>
                                <input name="phone" defaultValue={customer?.phone} className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mağaza Kodu</label>
                            <input
                                name="storeCode"
                                defaultValue={customer?.storeCode}
                                list="storeCodesList"
                                className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                                placeholder="Kod ara (Şehir, Ad)..."
                                autoComplete="off"
                            />
                            <datalist id="storeCodesList">
                                {storeCodes.map(store => (
                                    <option key={store.code} value={store.code}>
                                        {store.city} - {store.name}
                                    </option>
                                ))}
                            </datalist>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">E-posta</label>
                            <input name="email" type="email" defaultValue={customer?.email} className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">İletişim Ünvan / Açıklama</label>
                            <input name="contactName" defaultValue={customer?.contactName} className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none" />
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


