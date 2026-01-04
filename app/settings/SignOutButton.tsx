'use client';

import { LogOut } from 'lucide-react';
import { handleSignOut } from '@/app/actions/auth';

export function SignOutButton() {
    return (
        <div className="p-6 flex items-center justify-between gap-6 group hover:bg-red-500/5 transition-colors">
            <div className="flex-1 space-y-1">
                <h3 className="text-base font-medium flex items-center gap-2 text-red-600/90">
                    <LogOut size={18} />
                    Oturumu Kapat
                </h3>
                <p className="text-sm text-muted-foreground">Mevcut oturumunuzu sonlandırın.</p>
            </div>

            <form action={handleSignOut}>
                <button
                    type="submit"
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    Çıkış Yap
                </button>
            </form>
        </div>
    );
}
