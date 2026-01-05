import { getSaleById } from '@/app/actions/sales';
import { EditSaleForm } from '@/app/components/EditSaleForm';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sale = await getSaleById(id);

    if (!sale) {
        redirect('/sales');
    }

    return (
        <div className="min-h-screen bg-background pb-10">
            {/* Mobile Header */}
            <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
                <Link href="/sales" className="p-1 -ml-1 text-muted-foreground hover:text-foreground">
                    <ChevronLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-base font-bold flex items-center gap-2">
                        Satış Düzenle
                        {sale.orderNumber && (
                            <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded border border-primary/20 font-mono">
                                {sale.orderNumber}
                            </span>
                        )}
                    </h1>
                </div>
            </div>

            <div className="p-4 max-w-2xl mx-auto">
                <EditSaleForm
                    sale={sale}
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
