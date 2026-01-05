'use client';

import { LogOut } from 'lucide-react';
import { handleSignOut } from '@/app/actions/auth';

export function SignOutButton() {
    return (
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-50 transition-colors group h-full">
            <div className="space-y-1">
                <h3 className="text-sm font-medium flex items-center gap-2 text-red-600">
                    <LogOut size={16} />
                    Oturumu Sonlandır
                </h3>
                <p className="text-xs text-red-600/70">Mevcut oturumunuzu güvenle kapatın.</p>
            </div>

            <form action={handleSignOut}>
                <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-xs font-medium transition-colors shadow-sm"
                >
                    Çıkış Yap
                </button>
            </form>
        </div>
    );
}
