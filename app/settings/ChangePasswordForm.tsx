'use client';

import { useState } from 'react';
import { updatePassword } from '@/app/actions/settings';
import { Key, Eye, EyeOff } from 'lucide-react';

export function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMessage('');

        try {
            await updatePassword(newPassword);
            setMessage('Şifreniz başarıyla güncellendi.');
            setNewPassword('');
            // Optional: Sign out to force re-login? Usually not required for password change unless security policy enforces it.
        } catch (error) {
            setMessage('Şifre güncellenirken bir hata oluştu.');
        }
    }

    return (
        <div className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 group hover:bg-secondary/5 transition-colors">
            <div className="flex-1 space-y-1">
                <h3 className="text-base font-medium flex items-center gap-2">
                    <Key size={18} className="text-muted-foreground" />
                    Şifre Değiştir
                </h3>
                <p className="text-sm text-muted-foreground">Hesap giriş şifrenizi güncelleyin.</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full md:w-80 space-y-3">
                <div className="relative">
                    <input
                        type={isVisible ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-sm pl-9 pr-10 outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                        placeholder="Yeni şifre belirleyin"
                    />
                    <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <button
                        type="button"
                        onClick={() => setIsVisible(!isVisible)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                {message && (
                    <p className={`text-xs ${message.includes('başarıyla') ? 'text-green-500' : 'text-red-500'}`}>
                        {message}
                    </p>
                )}
                <div className="flex justify-end">
                    <button type="submit" className="bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium px-4 py-2 rounded-lg transition-colors">
                        Güncelle
                    </button>
                </div>
            </form>
        </div>
    );
}
