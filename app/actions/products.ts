'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

export type ProductDTO = {
    id?: string
    name: string
    productNumber?: string
    price: number
    cost?: number
    description?: string | null
}

export async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { name: 'asc' }
        })
        return products.map(p => ({
            ...p,
            price: p.price ? p.price.toNumber() : 0,
            cost: p.cost ? p.cost.toNumber() : 0,
            productNumber: p.productNumber || '', // Ensure string
            description: p.description
        }))
    } catch (error) {
        console.error("Failed to fetch products:", error)
        return []
    }
}

export async function createProduct(data: ProductDTO) {
    try {
        // Auto-generate product number if not existing
        // Check manually if needed or let DB/logic handle it.
        // For manual creation, we might want to follow the PRD-XXXX pattern too.

        let pNum = data.productNumber;
        if (!pNum) {
            const lastProduct = await prisma.product.findFirst({
                where: { productNumber: { startsWith: 'PRD-' } },
                orderBy: { productNumber: 'desc' }
            });

            let nextNum = 1;
            if (lastProduct) {
                const match = lastProduct.productNumber.match(/PRD-(\d+)/);
                if (match) {
                    nextNum = parseInt(match[1]) + 1;
                }
            }
            pNum = `PRD-${nextNum.toString().padStart(4, '0')}`;
        }

        const product = await prisma.product.create({
            data: {
                name: data.name,
                productNumber: pNum!,
                price: data.price,
                cost: data.cost,
                description: data.description
            }
        })
        revalidatePath('/admin/products')
        revalidatePath('/sales') // Prices might be relevant there
        return { success: true, data: product }
    } catch (error) {
        console.error("Failed to create product:", error)
        return { success: false, error: "Failed to create product" }
    }
}

export async function updateProduct(id: string, data: Partial<ProductDTO>) {
    try {
        const product = await prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                productNumber: data.productNumber,
                price: data.price,
                cost: data.cost,
                description: data.description
            }
        })
        revalidatePath('/admin/products')
        return { success: true, data: product }
    } catch (error) {
        console.error("Failed to update product:", error)
        return { success: false, error: "Failed to update product" }
    }
}

export async function deleteProduct(id: string) {
    try {
        await prisma.product.delete({
            where: { id }
        })
        revalidatePath('/admin/products')
        return { success: true }
    } catch (error) {
        console.error("Failed to delete product:", error)
        return { success: false, error: "Failed to delete product" }
    }
}

export async function renumberAllProducts() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { name: 'asc' } // Alphabetical order for neatness
        });

        let count = 0;
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const newNum = `PRD-${(i + 1).toString().padStart(4, '0')}`;

            if (product.productNumber !== newNum) {
                await prisma.product.update({
                    where: { id: product.id },
                    data: { productNumber: newNum }
                });
                count++;
            }
        }

        revalidatePath('/admin/products');
        return { success: true, message: `Successfully renumbered ${count} products.` };
    } catch (error) {
        console.error("Renumber error:", error);
        return { success: false, message: "Failed to renumber products." };
    }
}
