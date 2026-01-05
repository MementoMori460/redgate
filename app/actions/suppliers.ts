'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export type SupplierDTO = {
    id: string
    name: string
    contactName?: string | null
    email?: string | null
    phone?: string | null
    createdAt: string
    updatedAt: string
    productCount?: number
}

export async function getSuppliers() {
    try {
        const suppliers = await prisma.supplier.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        return suppliers.map(s => ({
            ...s,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
            productCount: s._count.products
        }));
    } catch (error) {
        console.error("Failed to fetch suppliers:", error);
        return [];
    }
}

export async function createSupplier(data: { name: string; contactName?: string; email?: string; phone?: string }) {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.supplier.create({
            data: {
                name: data.name,
                contactName: data.contactName,
                email: data.email,
                phone: data.phone
            }
        });
        revalidatePath('/suppliers');
        return { success: true };
    } catch (error) {
        console.error("Failed to create supplier:", error);
        return { success: false, error: "Failed to create supplier" };
    }
}

export async function updateSupplier(id: string, data: { name?: string; contactName?: string; email?: string; phone?: string }) {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.supplier.update({
            where: { id },
            data
        });
        revalidatePath('/suppliers');
        revalidatePath('/admin/products'); // Products might list supplier name
        return { success: true };
    } catch (error) {
        console.error("Failed to update supplier:", error);
        return { success: false, error: "Failed to update supplier" };
    }
}

export async function deleteSupplier(id: string) {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.supplier.delete({
            where: { id }
        });
        revalidatePath('/suppliers');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete supplier:", error);
        return { success: false, error: "Failed to delete supplier" };
    }
}

export async function getSupplierProducts(id: string) {
    try {
        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: {
                products: {
                    orderBy: { name: 'asc' }
                }
            }
        });

        if (!supplier) return [];

        return supplier.products.map(p => ({
            id: p.id,
            name: p.name,
            productNumber: p.productNumber,
            price: p.price ? p.price.toNumber() : 0,
            cost: p.cost ? p.cost.toNumber() : 0,
            description: p.description
        }));
    } catch (error) {
        console.error("Failed to fetch supplier products:", error);
        return [];
    }
}
