'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export type SaleDTO = {
    id?: string
    date: string
    storeCode: string
    region: string
    city: string
    storeName: string
    salesPerson: string
    customerName?: string
    customerContact?: string
    item: string
    price: number
    quantity: number
    total: number
    profit: number
    isShipped?: boolean
    status?: string
}

export async function getSales() {
    try {
        const session = await auth();
        const role = session?.user?.role?.toLowerCase();
        const name = session?.user?.name;

        let whereClause: any = {};

        // SALES role sees only their own sales
        if (role === 'sales') {
            whereClause.salesPerson = name;
        }
        // CUSTOMER role sees only their own orders (linked by username/contact?)
        // For now logic primarily supports the Sales Person restriction requested.

        const sales = await prisma.sale.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc'
            }
        })

        const canSeeProfit = role === 'admin' || role === 'accountant';

        // Convert Decimal and Date to simpler types for Client Components
        return sales.map(sale => ({
            ...sale,
            date: sale.date.toISOString().split('T')[0], // YYYY-MM-DD
            createdAt: sale.createdAt.toISOString(),
            updatedAt: sale.updatedAt.toISOString(),
            customerName: sale.customerName || '',
            customerContact: sale.customerContact || '',
            price: sale.price.toNumber(),
            total: sale.total.toNumber(),
            profit: canSeeProfit ? sale.profit.toNumber() : 0, // Hide profit for others
            // Add a flag to DTO to indicate if profit is real or masked? 
            // Better yet, maybe just don't return it or return 0.
        }))
    } catch (error) {
        console.error("Failed to fetch sales:", error)
        return []
    }
}

export async function createSale(data: SaleDTO) {
    try {
        const newSale = await prisma.sale.create({
            data: {
                date: new Date(data.date),
                storeCode: data.storeCode,
                region: data.region,
                city: data.city,
                storeName: data.storeName,
                salesPerson: data.salesPerson,
                customerName: data.customerName,
                customerContact: data.customerContact,
                item: data.item,
                price: data.price,
                quantity: data.quantity,
                total: data.total,
                profit: data.profit,
                isShipped: data.isShipped || false,
            }
        })
        revalidatePath('/')

        // Convert Decimals for client
        const serializedSale = {
            ...newSale,
            date: newSale.date.toISOString().split('T')[0],
            createdAt: newSale.createdAt.toISOString(),
            updatedAt: newSale.updatedAt.toISOString(),
            customerName: newSale.customerName || '',
            customerContact: newSale.customerContact || '',
            price: newSale.price.toNumber(),
            total: newSale.total.toNumber(),
            profit: newSale.profit.toNumber(),
        }

        return { success: true, data: serializedSale }
    } catch (error) {
        console.error("Failed to create sale:", error)
        return { success: false, error: "Failed to create sale" }
    }
}

export async function updateSale(id: string, data: Partial<SaleDTO>) {
    try {
        const updateData: any = { ...data }

        // Handle conversions if provided
        if (data.date) updateData.date = new Date(data.date)

        const updatedSale = await prisma.sale.update({
            where: { id },
            data: updateData
        })
        revalidatePath('/')
        return { success: true, data: updatedSale }
    } catch (error) {
        console.error("Failed to update sale:", error)
        return { success: false, error: "Failed to update sale" }
    }
}

export async function deleteSale(id: string) {
    try {
        await prisma.sale.delete({
            where: { id }
        })
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error("Failed to delete sale:", error)
        return { success: false, error: "Failed to delete sale" }
    }
}

export async function shipSale(id: string) {
    try {
        await prisma.sale.update({
            where: { id },
            data: { isShipped: true }
        })
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error("Failed to ship sale:", error)
        return { success: false, error: "Failed to ship sale" }
    }
}

// Customer Suggestion Helper
export async function getCustomers() {
    try {
        const customers = await prisma.sale.findMany({
            select: {
                customerName: true,
                customerContact: true,
            },
            distinct: ['customerName'],
            where: {
                customerName: {
                    not: null
                }
            }
        });
        return customers.map(c => ({
            name: c.customerName || '',
            contact: c.customerContact || ''
        })).filter(c => c.name !== '');
    } catch (error) {
        console.error("Failed to fetch customers:", error);
        return [];
    }
}

// Store Actions

export async function getStores() {
    try {
        const stores = await prisma.store.findMany({
            orderBy: { name: 'asc' }
        });
        return stores;
    } catch (error) {
        console.error("Failed to fetch stores:", error);
        return [];
    }
}

export async function getStoreByCode(code: string) {
    try {
        const store = await prisma.store.findUnique({
            where: { code }
        });
        return store;
    } catch (error) {
        console.error("Failed to fetch store:", error);
        return null;
    }
}
