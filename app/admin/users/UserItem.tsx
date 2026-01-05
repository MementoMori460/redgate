'use client';

import { useState } from 'react';
import { deleteUser, updatePassword } from '@/app/actions/users';
import { Trash2, Key, X, Check } from 'lucide-react';
import { ConfirmationModal } from '@/app/components/ConfirmationModal';

interface UserItemProps {
    user: {
        id: string;
        name: string;
        username: string;
        role: string;
    };
}

export function UserItem({ user }: UserItemProps) {
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        await deleteUser(user.id);
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await updatePassword(user.id, newPassword);
            if (result.success) {
                alert('Şifre güncellendi.');
                setIsPasswordModalOpen(false);
                setNewPassword('');
            } else {
                alert('Hata: ' + result.error);
            }
        } catch (error) {
            alert('Bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-border/50 hover:border-primary/20 transition-all">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary uppercase">
                    {user.name.charAt(0)}
                </div>
                <div>
                    <p className="font-medium text-foreground">{user.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>@{user.username}</span>
                        <span>•</span>
                        <span className="bg-secondary/50 px-2 py-0.5 rounded text-foreground font-medium uppercase">{user.role}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Şifre Değiştir"
                >
                    <Key size={18} />
                </button>
                <button
                    onClick={handleDeleteClick}
                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Sil"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Password Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-sm rounded-xl border border-border shadow-2xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold">Şifre Değiştir</h3>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <strong>@{user.username}</strong> için yeni şifre belirleyin.
                        </p>
                        <form onSubmit={handlePasswordUpdate} className="space-y-4">
                            <input
                                type="password"
                                placeholder="Yeni Şifre"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/50"
                                required
                                minLength={4}
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    {isLoading ? '...' : <><Check size={16} /> Güncelle</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Kullanıcıyı Sil"
                message={<><strong>{user.name}</strong> kullanıcısını silmek istediğinize emin misiniz?</>}
                confirmText="Sil"
                isDangerous={true}
                isLoading={isDeleting}
                icon="trash"
            />
        </div>
    );
}
