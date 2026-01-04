'use client';

import { useState, useEffect } from 'react';
import { Target, Save, Loader2 } from 'lucide-react';
import { getSetting, updateSetting } from '../actions/settings';

import { useRole } from '../contexts/RoleContext';

export function RevenueTargetForm() {
    const { role } = useRole();
    const [target, setTarget] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        getSetting('TARGET_REVENUE').then((value) => {
            if (value) setTarget(value);
            setIsLoading(false);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');

        try {
            const result = await updateSetting('TARGET_REVENUE', target);
            if (result.success) {
                setMessage('Ciro hedefi güncellendi.');
            } else {
                setMessage(result.error || 'Hata oluştu.');
            }
        } catch (error) {
            setMessage('Hata oluştu.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    const isAdmin = role === 'admin';

    if (!isAdmin) return null;

    return (
        <div className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 group hover:bg-secondary/5 transition-colors">
            <div className="flex-1 space-y-1">
                <h3 className="text-base font-medium flex items-center gap-2">
                    <Target size={18} className="text-muted-foreground" />
                    Ciro Hedefi
                </h3>
                <p className="text-sm text-muted-foreground">Aylık hedef ciro tutarını belirleyin.</p>

                {!isAdmin && (
                    <div className="mt-2 inline-flex items-center text-xs text-yellow-600 bg-yellow-500/10 px-2 py-1 rounded">
                        Bu ayarı sadece yöneticiler değiştirebilir.
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="w-full md:w-80 space-y-3">
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        placeholder="Örn: 775000"
                        className="flex-1 bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary/50 outline-none transition-all font-mono disabled:opacity-50"
                        required
                        disabled={!isAdmin}
                    />
                    <button
                        type="submit"
                        disabled={isSaving || !isAdmin}
                        className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : 'Kaydet'}
                    </button>
                </div>
                {message && (
                    <div className={`text-xs text-right ${message.includes('Hata') ? 'text-red-500' : 'text-green-500'}`}>
                        {message}
                    </div>
                )}
            </form>
        </div>
    );
}
