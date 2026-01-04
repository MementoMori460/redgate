'use client';

import { useState, useEffect } from 'react';
import { getSetting, saveSetting } from '../../actions/settings';
import { Save, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
    const [maxShippingDays, setMaxShippingDays] = useState('3');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const days = await getSetting('MAX_SHIPPING_DAYS');
        if (days) setMaxShippingDays(days);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const result = await saveSetting('MAX_SHIPPING_DAYS', maxShippingDays);
        if (result.success) {
            alert('Ayarlar kaydedildi.');
        } else {
            alert('Kayıt başarısız.');
        }
        setIsSaving(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Sistem Ayarları</h1>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-yellow-500/10 rounded-lg text-yellow-600">
                        <AlertTriangle className="shrink-0" size={24} />
                        <div>
                            <h3 className="font-semibold text-sm">Geciken Kargo Uyarısı</h3>
                            <p className="text-sm mt-1">Burada belirtilen günden daha uzun süredir kargolanmamış siparişler için tüm kullanıcılara uyarı gösterilecektir.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Maksimum Kargo Süresi (Gün)</label>
                        <input
                            type="number"
                            min="1"
                            required
                            className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary/50 outline-none"
                            value={maxShippingDays}
                            onChange={(e) => setMaxShippingDays(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? 'Kaydediliyor...' : <><Save size={18} /> Kaydet</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
