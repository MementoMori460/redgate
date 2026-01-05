import { getSuppliers } from '../actions/suppliers';
import SuppliersClient from './SuppliersClient';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function SuppliersPage() {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        redirect('/');
    }

    const suppliers = await getSuppliers();

    return (
        <div className="min-h-screen bg-background pb-10">
            <SuppliersClient initialSuppliers={suppliers} />
        </div>
    );
}
