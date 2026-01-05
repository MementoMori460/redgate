import { SalesHistoryClient } from './SalesHistoryClient';
import { getSales } from '@/app/actions/sales';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Next.js 15+ searchParams is a promise
type Params = Promise<{ [key: string]: string | string[] | undefined }>

export default async function SalesPage(props: { searchParams: Params }) {
    const session = await auth();
    if (!session) {
        redirect('/login');
    }

    const searchParams = await props.searchParams;

    // Default to current month if not provided
    const now = new Date();
    const month = searchParams.month ? parseInt(searchParams.month as string) : now.getMonth(); // 0-11
    const year = searchParams.year ? parseInt(searchParams.year as string) : now.getFullYear();

    const sales = await getSales(month, year);

    return (
        <div className="space-y-6">
            <SalesHistoryClient initialSales={sales} initialDate={{ month, year }} />
        </div>
    );
}
