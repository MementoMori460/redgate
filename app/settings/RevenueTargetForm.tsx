'use client';

import { useState, useEffect } from 'react';
import { Target, Save, Loader2 } from 'lucide-react';
import { getSetting, updateSetting } from '../actions/settings';

export function RevenueTargetForm() {
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
                setMessage('Hata oluştu.');
            }
        } catch (error) {
            setMessage('Hata oluştu.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="text-primary" size={20} />
                Ciro Hedefi Ayarları
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary-foreground">Aylık Ciro Hedefi (TL)</label>
                    <input
                        type="number"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        placeholder="Örn: 775000"
                        className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all font-mono"
                        required
                    />
                </div>

                {message && (
                    <div className={`text-sm font-medium ${message.includes('Hata') ? 'text-red-500' : 'text-green-500'}`}>
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
            </form>
        </div>
    );
}
