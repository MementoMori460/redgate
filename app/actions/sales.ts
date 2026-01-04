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
    description?: string
    waybillNumber?: string
    invoiceNumber?: string
    paymentStatus?: string
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

        // CUSTOMER role sees only their own orders
        if (role === 'customer') {
            whereClause.customerName = name;
        }

        const sales = await prisma.sale.findMany({
            where: whereClause,
            orderBy: {
                createdAt: 'desc'
            }
        })

        const canSeeProfit = role === 'admin' || role === 'accountant';
        const canSeeInvoice = role === 'admin' || role === 'accountant';
        const canSeeWaybill = role === 'admin' || role === 'warehouse' || role === 'manager' || role === 'accountant';

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
            profit: canSeeProfit ? sale.profit.toNumber() : 0,
            status: sale.status,
            description: sale.description || '',
            waybillNumber: canSeeWaybill ? (sale.waybillNumber || '') : '',
            invoiceNumber: canSeeInvoice ? (sale.invoiceNumber || '') : '',
            paymentStatus: canSeeInvoice ? (sale.paymentStatus || 'UNPAID') : '',
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
                status: data.status || 'APPROVED',
                description: data.description,
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
            description: newSale.description || '',
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

        // Trigger shipping email if marked as shipped
        if (data.isShipped === true) {
            // We don't await this to keep UI responsive, or maybe we should to report errors?
            // Fire and forget for now.
            sendShippingEmail(id).catch(err => console.error("Failed to trigger email:", err));
        }

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

import { sendShippingEmail } from "../utils/notifications";

export async function shipSale(id: string, shippedQuantity: number, waybillNumber: string) {
    try {
        const sale = await prisma.sale.findUnique({ where: { id } });
        if (!sale) return { success: false, error: "Sale not found" };

        if (shippedQuantity >= sale.quantity) {
            // Full shipment
            await prisma.sale.update({
                where: { id },
                data: {
                    isShipped: true,
                    waybillNumber: waybillNumber,
                    status: 'SHIPPED'
                }
            });
        } else {
            // Partial shipment - Split the record
            // 1. Update the current record to represent the SHIPPED portion
            const unitPrice = sale.price.toNumber();
            const unitProfit = sale.profit.toNumber() / sale.quantity; // Approximate per unit profit

            // Update original as the SHIPPED one
            await prisma.sale.update({
                where: { id },
                data: {
                    quantity: shippedQuantity,
                    total: unitPrice * shippedQuantity,
                    profit: unitProfit * shippedQuantity,
                    isShipped: true,
                    waybillNumber: waybillNumber,
                    status: 'SHIPPED',
                    description: (sale.description || '') + ` (Daha önce ${sale.quantity} adetti, parçalı sevk edildi)`
                }
            });

            // 2. Create new record for the REMAINING portion
            const remainingQty = sale.quantity - shippedQuantity;
            await prisma.sale.create({
                data: {
                    date: sale.date,
                    storeCode: sale.storeCode,
                    region: sale.region,
                    city: sale.city,
                    storeName: sale.storeName,
                    salesPerson: sale.salesPerson,
                    customerName: sale.customerName,
                    customerContact: sale.customerContact,
                    item: sale.item,
                    price: sale.price,
                    quantity: remainingQty,
                    total: unitPrice * remainingQty,
                    profit: unitProfit * remainingQty,
                    isShipped: false,
                    status: 'PENDING', // Still pending
                    description: (sale.description || '') + ` (Parçalı sevk bakiyesi)`,
                    customerId: sale.customerId
                }
            });
        }

        // Send email notification (fire and forget)
        sendShippingEmail(id); // Note: If split, ID still points to shipped one, which is correct.

        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error("Failed to ship sale:", error)
        return { success: false, error: "Failed to ship sale" }
    }
}

export async function markSaleAsPaid(id: string, invoiceNumber: string) {
    try {
        await prisma.sale.update({
            where: { id },
            data: {
                paymentStatus: 'PAID',
                invoiceNumber: invoiceNumber
            }
        });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to mark paid:", error);
        return { success: false, error: "Failed to mark paid" };
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
