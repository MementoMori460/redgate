'use client';

import { useState } from 'react';
import { importChecklistData } from '../actions/import-legacy';
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function ImportDataButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleImport = async () => {
        if (!confirm('Geçmiş satış verileri (checklist.csv) içe aktarılacak. Bu işlem veritabanını günceller. Devam edilsin mi?')) return;

        const password = prompt('Lütfen işlem şifresini giriniz:');
        if (password !== '3987') {
            alert('Hatalı şifre. İşlem iptal edildi.');
            return;
        }

        setIsLoading(true);
        setResult(null);
        try {
            const res = await importChecklistData();
            setResult(res);
            if (res.success) {
                // Optional: refresh page or router
                window.location.reload();
            }
        } catch (err) {
            setResult({ success: false, message: 'Bir hata oluştu.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-1">
                <h3 className="font-semibold flex items-center gap-2">
                    <Database size={18} className="text-primary" />
                    Eski Verileri İçe Aktar (Checklist 2025)
                </h3>
                <p className="text-sm text-muted-foreground">Geçmiş satış verilerini veritabanına yükle.</p>
            </div>

            <div className="flex items-center gap-3">
                {result && (
                    <span className={`text-xs font-medium ${result.success ? 'text-green-500' : 'text-red-500'} flex items-center gap-1`}>
                        {result.success ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        {result.message}
                    </span>
                )}

                <button
                    onClick={handleImport}
                    disabled={isLoading}
                    className="bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'İçe Aktar'}
                </button>
            </div>
        </div>
    );
}
