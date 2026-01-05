'use client';

import { useState, useRef } from 'react';
import { Download, Upload, Loader2, Database } from 'lucide-react';
import { exportDatabase, importDatabase } from '../actions/database';
import { ConfirmationModal } from '../components/ConfirmationModal';

export function BackupManager() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingFile(file);
    };

    const handleRestoreConfirm = async () => {
        if (!pendingFile) return;

        try {
            setLoading(true);
            setStatus('Dosya okunuyor...');

            const text = await pendingFile.text();
            const data = JSON.parse(text);

            setStatus('Veriler yükleniyor (büyük dosyalar zaman alabilir)...');
            await importDatabase(data);

            setStatus('Yedek başarıyla yüklendi!');
            alert('Yedek başarıyla yüklendi.'); // This success alert is acceptable or can be replaced with toast later
            window.location.reload();
        } catch (error) {
            console.error(error);
            setStatus('Yükleme hatası: ' + (error as Error).message);
            alert('Hata: ' + (error as Error).message);
        } finally {
            setLoading(false);
            setPendingFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
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
                        ref={fileInputRef}
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

            <ConfirmationModal
                isOpen={!!pendingFile}
                onClose={() => {
                    setPendingFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                onConfirm={handleRestoreConfirm}
                title="Yedekten Yükle"
                message="DİKKAT: Bu işlem veritabanına veri ekleyecektir. Mevcut kayıtlarınızın üzerine yazılabilir. Devam etmek istiyor musunuz?"
                confirmText="Yükle"
                isDangerous={true}
                isLoading={loading}
                icon="alert"
            />
        </div>
    );
}
