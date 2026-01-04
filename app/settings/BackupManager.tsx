'use client';

import { useState } from 'react';
import { Download, Upload, Loader2, Database } from 'lucide-react';
import { exportDatabase, importDatabase } from '../actions/database';

export function BackupManager() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const handleBackup = async () => {
        try {
            setLoading(true);
            setStatus('Yedek alınıyor...');
            const data = await exportDatabase();

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `redgate_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setStatus('Yedek başarıyla indirildi.');
        } catch (error) {
            console.error(error);
            setStatus('Yedekleme hatası oluştu.');
        } finally {
            setLoading(false);
            setTimeout(() => setStatus(''), 3000);
        }
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('DİKKAT: Bu işlem veritabanına veri ekleyecektir. Mevcut kayıtlarınızın üzerine yazılabilir. Devam etmek istiyor musunuz?')) {
            e.target.value = '';
            return;
        }

        try {
            setLoading(true);
            setStatus('Dosya okunuyor...');

            const text = await file.text();
            const data = JSON.parse(text);

            setStatus('Veriler yükleniyor (büyük dosyalar zaman alabilir)...');
            await importDatabase(data);

            setStatus('Yedek başarıyla yüklendi!');
            alert('Yedek başarıyla yüklendi.');
            window.location.reload();
        } catch (error) {
            console.error(error);
            setStatus('Yükleme hatası: ' + (error as Error).message);
            alert('Hata: ' + (error as Error).message);
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    return (
        <div className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Veritabanı İşlemleri</h3>
                    <p className="text-sm text-muted-foreground">Yedek alma ve geri yükleme işlemleri</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                    onClick={handleBackup}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Yedek İndir
                </button>

                <div className="relative">
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleRestore}
                        disabled={loading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <button
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Yedekten Yükle
                    </button>
                </div>
            </div>

            {status && (
                <div className="text-sm text-muted-foreground animate-in fade-in">
                    {status}
                </div>
            )}
        </div>
    );
}
