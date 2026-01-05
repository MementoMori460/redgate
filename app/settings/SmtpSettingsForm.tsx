'use client';

import { useState, useEffect } from 'react';
import { saveSetting, getSetting } from '../actions/settings';
import { Mail, Server, Lock, Save, Eye, EyeOff } from 'lucide-react';

export function SmtpSettingsForm() {
    const [host, setHost] = useState('');
    const [port, setPort] = useState('587');
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [showPass, setShowPass] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const loadSettings = async () => {
            const [h, p, u, pa] = await Promise.all([
                getSetting('SMTP_HOST'),
                getSetting('SMTP_PORT'),
                getSetting('SMTP_USER'),
                getSetting('SMTP_PASS')
            ]);
            if (h) setHost(h);
            if (p) setPort(p);
            if (u) setUser(u);
            if (pa) setPass(pa);
            setLoading(false);
        };
        loadSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            await Promise.all([
                saveSetting('SMTP_HOST', host),
                saveSetting('SMTP_PORT', port),
                saveSetting('SMTP_USER', user),
                saveSetting('SMTP_PASS', pass)
            ]);
            setMessage({ text: 'Ayarlar başarıyla kaydedildi.', type: 'success' });
        } catch (error) {
            setMessage({ text: 'Kaydedilirken bir hata oluştu.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-6 text-sm text-muted-foreground">Ayarlar yükleniyor...</div>;

    return (
        <div className="p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Mail size={20} className="text-primary" />
                E-posta Sunucu Ayarları (SMTP)
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">SMTP Sunucusu</label>
                        <div className="relative">
                            <Server className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                            <input
                                type="text"
                                placeholder="smtp.gmail.com"
                                value={host}
                                onChange={(e) => setHost(e.target.value)}
                                className="w-full bg-secondary/30 border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Port</label>
                        <input
                            type="text"
                            placeholder="587"
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Kullanıcı Adı (E-posta)</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                        <input
                            type="text"
                            placeholder="ornek@sirket.com"
                            value={user}
                            onChange={(e) => setUser(e.target.value)}
                            className="w-full bg-secondary/30 border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Şifre (Uygulama Şifresi)</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                        <input
                            type={showPass ? "text" : "password"}
                            placeholder="********"
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
                            className="w-full bg-secondary/30 border border-border rounded-lg pl-9 pr-10 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        Gmail kullanıyorsanız Google Hesabım &gt; Güvenlik &gt; Uygulama Şifreleri kısmından aldığınız şifreyi giriniz.
                    </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        {!saving && <Save size={16} />}
                    </button>

                    {message && (
                        <span className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {message.text}
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}
