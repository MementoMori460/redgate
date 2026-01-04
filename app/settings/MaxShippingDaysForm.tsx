'use client';

import { useState, useEffect } from 'react';
import { getSetting, saveSetting } from '../actions/settings';
import { useRole } from '../contexts/RoleContext';
import { Truck } from 'lucide-react';
import { clsx } from 'clsx';

export function MaxShippingDaysForm() {
    const { role } = useRole();
    const [days, setDays] = useState('3'); // Default 3 days
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadSetting();
    }, []);

    const loadSetting = async () => {
        const value = await getSetting('MAX_SHIPPING_DAYS');
        if (value) setDays(value);
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');

        const result = await saveSetting('MAX_SHIPPING_DAYS', days);
        if (result.success) {
            setMessage('Ayarlar güncellendi.');
        } else {
            setMessage('Hata: ' + result.error);
        }
        setIsSaving(false);
    };

    if (role !== 'admin') return null;

    return (
        <form onSubmit={handleSubmit} className="p-4 flex items-center justify-between group">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                    <Truck size={20} />
                </div>
                <div>
                    <h3 className="font-medium">Maksimum Kargo Süresi</h3>
                    <p className="text-sm text-muted-foreground">Siparişlerin kargolanması için izin verilen gün sayısı.</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="1"
                        value={days}
                        onChange={(e) => setDays(e.target.value)}
                        className="w-20 bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-right font-mono focus:ring-1 focus:ring-primary/50 outline-none"
                    />
                    <span className="text-sm text-muted-foreground">Gün</span>
                </div>
                <button
                    type="submit"
                    disabled={isSaving || isLoading}
                    className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                    {isSaving ? '...' : 'Kaydet'}
                </button>
            </div>
            {message && <span className="absolute bottom-1 right-4 text-[10px] text-green-500">{message}</span>}
        </form>
    );
}
