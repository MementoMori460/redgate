import { AddSaleForm } from '@/app/components/AddSaleForm';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddSalePage() {
    return (
        <div className="min-h-screen bg-background pb-10">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
                <Link href="/sales" className="p-1 -ml-1 text-muted-foreground hover:text-foreground">
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-base font-bold flex items-center gap-2">
                        Yeni Satış Ekle
                    </h1>
                </div>
            </div>

            <div className="p-4 max-w-2xl mx-auto">
                <AddSaleForm
                    onSuccess={async () => {
                        'use server';
                        redirect('/sales');
                    }}
                    onCancel={async () => {
                        'use server';
                        redirect('/sales');
                    }}
                />
            </div>
        </div>
    );
}
