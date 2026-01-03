'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

export type ProductDTO = {
    id: string;
    productNumber: string;
    name: string;
    price: number | null;
    createdAt: Date;
    updatedAt: Date;
};

export async function getProducts(query?: string) {
    try {
        const products = await prisma.product.findMany({
            where: query ? {
                OR: [
                    { name: { contains: query } }, // Case insensitive usually depends on DB collation
                    { productNumber: { contains: query } }
                ]
            } : undefined,
            orderBy: { name: 'asc' }
        });

        // Convert Decimal to number
        return products.map(p => ({
            ...p,
            price: p.price ? p.price.toNumber() : null
        })) as ProductDTO[];
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return [];
    }
}

export async function createProduct(data: { name: string; price?: number; productNumber?: string }) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    try {
        let productNumber = data.productNumber;

        if (!productNumber) {
            // Generate next product number
            const lastProduct = await prisma.product.findFirst({
                orderBy: { productNumber: 'desc' }
            });

            let nextNum = 1;
            if (lastProduct && lastProduct.productNumber.startsWith('PRD-')) {
                const current = parseInt(lastProduct.productNumber.split('-')[1]);
                if (!isNaN(current)) nextNum = current + 1;
            }

            productNumber = `PRD-${String(nextNum).padStart(3, '0')}`;
        }

        await prisma.product.create({
            data: {
                productNumber,
                name: data.name,
                price: data.price
            }
        });

        revalidatePath('/admin/products');
        return { success: true };
    } catch (error) {
        console.error("Failed to create product:", error);
        return { success: false, error: "Failed to create product" };
    }
}

export async function updateProduct(id: string, data: { name: string; price?: number; productNumber: string }) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    try {
        await prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                price: data.price,
                productNumber: data.productNumber
            }
        });

        revalidatePath('/admin/products');
        return { success: true };
    } catch (error) {
        console.error("Failed to update product:", error);
        return { success: false, error: "Failed to update product" };
    }
}

export async function deleteProduct(id: string) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    try {
        await prisma.product.delete({
            where: { id }
        });

        revalidatePath('/admin/products');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete product:", error);
        return { success: false, error: "Failed to delete product" };
    }
}
