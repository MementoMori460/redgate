'use client';

import { UserPlus, User, Shield, Key, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { createUser } from '@/app/actions/users';

export function CreateUserForm() {
    const [isVisible, setIsVisible] = useState(false);

    async function handleSubmit(formData: FormData) {
        const name = formData.get('name') as string;
        const username = formData.get('username') as string;
        const role = formData.get('role') as string;
        const password = formData.get('password') as string;

        await createUser(name, username, role, password);
        // Optional: clear form or show success message
        // For now, allow server action revalidate to handle updates
        const form = document.getElementById('createUserForm') as HTMLFormElement;
        form?.reset();
    }

    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserPlus className="text-primary" size={20} />
                Yeni Kullanıcı Ekle
            </h2>
            <form action={handleSubmit} className="space-y-4" id="createUserForm">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary-foreground">Ad Soyad</label>
                    <div className="relative">
                        <input name="name" required className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm pl-9 outline-none focus:ring-2 focus:ring-primary/50" placeholder="Örn. Ahmet Yılmaz" />
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary-foreground">Kullanıcı Adı</label>
                    <div className="relative">
                        <input name="username" required className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm pl-9 outline-none focus:ring-2 focus:ring-primary/50" placeholder="Örn. ahmetyilmaz" />
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary-foreground">Rol</label>
                    <div className="relative">
                        <select name="role" className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm pl-9 outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer">
                            <option value="SALES">Satış Personeli</option>
                            <option value="WAREHOUSE">Depo Sorumlusu</option>
                            <option value="ACCOUNTANT">Muhasebeci</option>
                            <option value="ADMIN">Yönetici/Müdür</option>
                        </select>
                        <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary-foreground">Şifre</label>
                    <div className="relative">
                        <input
                            type={isVisible ? "text" : "password"}
                            name="password"
                            required
                            className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm pl-9 pr-10 outline-none focus:ring-2 focus:ring-primary/50"
                            placeholder="******"
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
                </div>
                <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg font-medium shadow-lg shadow-primary/25 transition-all text-sm">
                    Kullanıcı Oluştur
                </button>
            </form>
        </div>
    );
}
