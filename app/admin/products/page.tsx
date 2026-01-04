import { ProductsClient } from './ProductsClient';
import { getProducts } from '@/app/actions/products';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
    const session = await auth();
    // Double check authentication/authorization here just in case middleware/layout doesn't catch it
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'admin') {
        redirect('/');
    }

    const products = await getProducts();

    return (
        <div className="space-y-6">


            <ProductsClient initialProducts={products} />
        </div>
    );
}
