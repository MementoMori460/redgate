'use client';

import { useState } from 'react';
import { User } from '@prisma/client';
import { createUser, updateUser, deleteUser, updatePassword } from '@/app/actions/users';
import { Plus, Search, Edit2, Trash2, X, Loader2, Save, Key, Shield, Mail, Check, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ConfirmationModal } from '@/app/components/ConfirmationModal';
import { clsx } from 'clsx';
import { useRole } from '@/app/contexts/RoleContext';

type UserDTO = Omit<User, 'password'> & { email?: string | null };

interface UsersClientProps {
    initialUsers: UserDTO[];
}

const ROLES = [
    { id: 'ALL', label: 'Tümü' },
    { id: 'ADMIN', label: 'Yöneticiler' },
    { id: 'SALES', label: 'Satış' },
    { id: 'WAREHOUSE', label: 'Depo' },
    { id: 'ACCOUNTANT', label: 'Muhasebe' },
];

const getRoleLabel = (role: string) => {
    switch (role?.toUpperCase()) {
        case 'ADMIN': return 'Yönetici';
        case 'SALES': return 'Satış Personeli';
        case 'WAREHOUSE': return 'Depo Sorumlusu';
        case 'ACCOUNTANT': return 'Muhasebeci';
        default: return role;
    }
}

export function UsersClient({ initialUsers }: UsersClientProps) {
    const { role: userRole } = useRole();
    const [users, setUsers] = useState(initialUsers);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserDTO | null>(null);

    // Password Modal
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordUserId, setPasswordUserId] = useState<string | null>(null);

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const filteredUsers = users.filter(u => {
        const matchesSearch =
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.username.toLowerCase().includes(search.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(search.toLowerCase());

        const matchesTab = activeTab === 'ALL' || u.role?.toUpperCase() === activeTab;

        return matchesSearch && matchesTab;
    });

    const handleDeleteClick = (id: string) => {
        setDeleteModal({ isOpen: true, id });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.id) return;
        setIsLoading(true);
        const result = await deleteUser(deleteModal.id);
        if (result.success) {
            router.refresh();
            setUsers(users.filter(u => u.id !== deleteModal.id));
            setDeleteModal({ isOpen: false, id: null });
        } else {
            alert('Silme işlemi başarısız oldu.');
        }
        setIsLoading(false);
    };

    const handleExport = () => {
        if (!filteredUsers.length) return;

        const headers = ["ID", "İsim", "Kullanıcı Adı", "E-posta", "Rol"];
        const csvContent = [
            headers.join(','),
            ...filteredUsers.map(u => [
                `"${u.id}"`,
                `"${u.name}"`,
                `"${u.username}"`,
                `"${u.email || ''}"`,
                `"${u.role}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `kullanicilar_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Header / Tabs */}
            <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Kullanıcı ara (Ad, Kullanıcı adı, E-posta)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>
                    <div className="flex gap-2 self-end sm:self-auto">
                        {userRole === 'admin' && (
                            <button
                                onClick={handleExport}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                            >
                                <Download size={18} />
                                İndir
                            </button>
                        )}
                        <button
                            onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                        >
                            <Plus size={18} />
                            Yeni Kullanıcı
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
                    {ROLES.map(role => (
                        <button
                            key={role.id}
                            onClick={() => setActiveTab(role.id)}
                            className={clsx(
                                "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap relative top-[1px]",
                                activeTab === role.id
                                    ? "text-primary border-b-2 border-primary bg-primary/5"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                            )}
                        >
                            {role.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/50 text-muted-foreground font-medium border-b border-border text-xs uppercase">
                            <tr>
                                <th className="px-4 py-3">Ad Soyad</th>
                                <th className="px-4 py-3">Kullanıcı Adı</th>
                                <th className="px-4 py-3">E-posta</th>
                                <th className="px-4 py-3">Rol</th>
                                <th className="px-4 py-3 w-32 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-secondary/20 transition-colors">
                                    <td className="px-4 py-3 font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            {user.name}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">@{user.username}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{user.email || '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 rounded bg-secondary text-xs font-medium text-secondary-foreground">
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => { setPasswordUserId(user.id); setIsPasswordModalOpen(true); }}
                                                className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-500 rounded-md transition-colors"
                                                title="Şifre Değiştir"
                                            >
                                                <Key size={16} />
                                            </button>
                                            <button
                                                onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                                                className="p-1.5 hover:bg-secondary rounded-md text-foreground transition-colors"
                                                title="Düzenle"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(user.id)}
                                                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-md transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                        Kullanıcı bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit User Modal */}
            {isModalOpen && (
                <UserModal
                    user={editingUser}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        router.refresh();
                        window.location.reload();
                    }}
                />
            )}

            {/* Password Modal */}
            {isPasswordModalOpen && passwordUserId && (
                <PasswordModal
                    userId={passwordUserId}
                    onClose={() => { setIsPasswordModalOpen(false); setPasswordUserId(null); }}
                />
            )}

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={handleDeleteConfirm}
                title="Kullanıcıyı Sil"
                message="Bu kullanıcıyı silmek istediğinize emin misiniz?"
                confirmText="Sil"
                isDangerous={true}
                isLoading={isLoading}
                icon="trash"
            />
        </div>
    );
}

function UserModal({ user, onClose, onSuccess }: { user: UserDTO | null, onClose: () => void, onSuccess: () => void }) {
    const [name, setName] = useState(user?.name || '');
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [role, setRole] = useState(user?.role || 'SALES');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const data = {
            name,
            username,
            email: email || undefined,
            role,
            password: password || undefined,
        };

        let result;
        if (user) {
            result = await updateUser(user.id, data);
        } else {
            result = await createUser(data as any);
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
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        {user ? <Edit2 size={18} /> : <Plus size={18} />}
                        {user ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Ekle'}
                    </h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Ad Soyad</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-secondary/20 focus:ring-2 focus:ring-primary/50 outline-none"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Kullanıcı Adı</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-secondary/20 focus:ring-2 focus:ring-primary/50 outline-none"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">E-posta</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-9 px-3 py-2 border border-border rounded-lg bg-secondary/20 focus:ring-2 focus:ring-primary/50 outline-none"
                                placeholder="ornek@sirket.com"
                            />
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Rol</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-secondary/20 focus:ring-2 focus:ring-primary/50 outline-none"
                        >
                            <option value="SALES">Satış Personeli</option>
                            <option value="WAREHOUSE">Depo Sorumlusu</option>
                            <option value="ACCOUNTANT">Muhasebeci</option>
                            <option value="ADMIN">Yönetici/Müdür</option>
                        </select>
                    </div>

                    {!user && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Şifre</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-secondary/20 focus:ring-2 focus:ring-primary/50 outline-none"
                                required={!user}
                                minLength={4}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function PasswordModal({ userId, onClose }: { userId: string, onClose: () => void }) {
    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const result = await updatePassword(userId, newPassword);
        if (result.success) {
            alert('Şifre güncellendi.');
            onClose();
        } else {
            alert('Hata: ' + result.error);
        }
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-sm rounded-xl shadow-xl border border-border animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Key size={18} />
                        Şifre Değiştir
                    </h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Yeni Şifre</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-secondary/20 focus:ring-2 focus:ring-primary/50 outline-none"
                            required
                            minLength={4}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Güncelle'}
                    </button>
                </form>
            </div>
        </div>
    );
}
