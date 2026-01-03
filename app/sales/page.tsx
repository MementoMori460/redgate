import { SalesHistoryClient } from './SalesHistoryClient';
import { getSales } from '@/app/actions/sales';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SalesPage() {
    const session = await auth();
    if (!session) {
        redirect('/login');
    }

    const sales = await getSales();

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Satış Geçmişi</h1>
                <p className="text-muted-foreground">Tüm satış kayıtlarını görüntüleyin ve filtreleyin.</p>
            </div>

            <SalesHistoryClient initialSales={sales} />
        </div>
    );
}
