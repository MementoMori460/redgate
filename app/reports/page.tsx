import { ReportsClient } from './ReportsClient';
import { getReportData } from '@/app/actions/reports';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
    const session = await auth();
    if (!session) {
        redirect('/login');
    }

    const reportData = await getReportData();

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Raporlar</h1>
                <p className="text-muted-foreground">Genel durum ve performans analizi.</p>
            </div>

            <ReportsClient data={reportData} />
        </div>
    );
}
