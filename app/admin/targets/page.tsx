
import { getMonthlyTargets } from '@/app/actions/targets';
import { TargetsClient } from './TargetsClient';

export default async function TargetsPage() {
    const currentYear = new Date().getFullYear();
    const targets = await getMonthlyTargets(currentYear);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Aylık Hedef Yönetimi</h1>
            <TargetsClient initialTargets={targets} currentYear={currentYear} />
        </div>
    );
}
