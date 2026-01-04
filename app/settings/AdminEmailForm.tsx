'use client';

import { useState, useEffect } from 'react';
import { getSetting, saveSetting } from '@/app/actions/settings';
import { Mail, Save } from 'lucide-react';

export function AdminEmailForm() {
    const [email, setEmail] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        getSetting('ADMIN_EMAIL').then(val => {
            if (val) setEmail(val);
        });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await saveSetting('ADMIN_EMAIL', email);
        alert('Yönetici e-postası kaydedildi.');
        setIsSaving(false);
    };

    return (
        <div className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 group hover:bg-secondary/5 transition-colors">
            <div className="flex-1 space-y-1">
                <h3 className="text-base font-medium flex items-center gap-2">
                    <Mail size={18} className="text-muted-foreground" />
                    Bildirim E-postası
                </h3>
                <p className="text-sm text-muted-foreground">Yeni sipariş bildirimlerinin gönderileceği yönetici adresi.</p>
            </div>

            <form onSubmit={handleSave} className="w-full md:w-80 flex gap-2">
                <input
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                />
                <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
                >
                    {isSaving ? '...' : <Save size={16} />}
                </button>
            </form>
        </div>
    );
}
