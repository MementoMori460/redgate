'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { toTitleCaseTR } from "@/lib/utils"
import { auth } from "@/auth"
import { sendShippingEmail, sendNewOrderEmailToAdmins, sendBatchOrderEmailToAdmins } from "../utils/notifications";

export type SaleDTO = {
    id?: string
    date: string
    storeCode: string
    region: string
    city: string
    storeName: string
    salesPerson: string
    customerName?: string | null
    customerContact?: string | null
    email?: string | null // New field
    customerId?: string | null // New field
    item: string
    price: number
    quantity: number
    total: number
    profit: number
    isShipped?: boolean
    status?: string
    description?: string | null
    waybillNumber?: string | null
    invoiceNumber?: string | null
    paymentStatus?: string | null
    orderNumber?: string | null // New field
}

export async function getSales(month?: number, year?: number) {
    try {
        const session = await auth();
        const role = session?.user?.role?.toLowerCase();
        const name = session?.user?.name;

        let whereClause: any = {
            deletedAt: null // Exclude soft-deleted items
        };

        // Date Filtering (Default to current month if not provided)
        // Note: Javascript months are 0-11
        const now = new Date();
        const targetYear = year ?? now.getFullYear();
        const targetMonth = month ?? now.getMonth();

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 1); // First day of next month

        whereClause.date = {
            gte: startDate,
            lt: endDate
        };

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
            orderNumber: sale.orderNumber || ''
        }))
    } catch (error) {
        console.error("Failed to fetch sales:", error)
        return []
    }
}
export async function getSaleById(id: string) {
    try {
        const sale = await prisma.sale.findUnique({
            where: { id }
        });

        if (!sale) return null;

        // Convert Decimal and Date
        return {
            ...sale,
            date: sale.date.toISOString().split('T')[0],
            createdAt: sale.createdAt.toISOString(),
            updatedAt: sale.updatedAt.toISOString(),
            customerName: sale.customerName || '',
            customerContact: sale.customerContact || '',
            price: sale.price.toNumber(),
            total: sale.total.toNumber(),
            profit: sale.profit.toNumber(),
            status: sale.status,
            description: sale.description || '',
            waybillNumber: sale.waybillNumber || '',
            invoiceNumber: sale.invoiceNumber || '',
            paymentStatus: sale.paymentStatus || '',
            orderNumber: sale.orderNumber || ''
        };
    } catch (error) {
        console.error("Failed to fetch sale by id:", error);
        return null;
    }
}

export async function getPendingOrders() {
    try {
        const session = await auth();
        // Assuming Admin is calling this, but we should enforce role check if needed.
        // For now, implicit via UI access control.

        const pendingSales = await prisma.sale.findMany({
            where: {
                status: 'PENDING',
                deletedAt: null // Exclude deleted
            },
            orderBy: {
                date: 'asc' // Show oldest first
            }
        });

        // Map to DTO (Reuse logic or simplify)
        return pendingSales.map(sale => ({
            ...sale,
            date: sale.date.toISOString().split('T')[0],
            createdAt: sale.createdAt.toISOString(),
            updatedAt: sale.updatedAt.toISOString(),
            customerName: sale.customerName || '',
            customerContact: sale.customerContact || '',
            price: sale.price.toNumber(),
            total: sale.total.toNumber(),
            profit: sale.profit.toNumber(),
            status: sale.status,
            description: sale.description || '',
            waybillNumber: sale.waybillNumber || '',
            invoiceNumber: sale.invoiceNumber || '',
            paymentStatus: sale.paymentStatus || '',
            orderNumber: sale.orderNumber || ''
        }));

    } catch (error) {
        console.error("Failed to fetch pending orders:", error);
        return [];
    }
}

export async function createSale(data: SaleDTO) {
    try {
        let customerId = data.customerId;

        // Auto-link or Create Customer if name provided
        if (data.customerName && !customerId) {
            // 1. Try to find by name
            const existingCustomer = await prisma.customer.findFirst({
                where: { name: data.customerName }
            });

            if (existingCustomer) {
                customerId = existingCustomer.id;
            } else {
                // 2. Create if not exists (Quick Register)
                const newCustomer = await prisma.customer.create({
                    data: {
                        name: data.customerName,
                        contactName: data.customerName, // Use name as contact person too by default
                        phone: data.customerContact,
                        email: data.email, // Save email if provided
                        city: data.city, // Infer city from sale
                        storeCode: data.storeCode !== 'ONLINE' ? data.storeCode : undefined,
                    }
                });
                customerId = newCustomer.id;
            }
        }

        // Generate Order Number
        const now = new Date(data.date);
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const key = `${year}${month}`; // YYYYMM

        // Find max order number for this month
        // We look for orderNumbers starting with "ORD-YYYYMM-"
        const prefix = `ORD-${key}-`;
        const lastSale = await prisma.sale.findFirst({
            where: {
                orderNumber: {
                    startsWith: prefix
                }
            },
            orderBy: {
                orderNumber: 'desc'
            },
            select: {
                orderNumber: true
            }
        });

        let sequence = 1;
        if (lastSale && lastSale.orderNumber) {
            const parts = lastSale.orderNumber.split('-');
            if (parts.length === 3) {
                sequence = parseInt(parts[2], 10) + 1;
            }
        }

        const orderNumber = `${prefix}${sequence.toString().padStart(4, '0')}`;

        const newSale = await prisma.sale.create({
            data: {
                date: new Date(data.date),
                storeCode: data.storeCode,
                region: toTitleCaseTR(data.region),
                city: toTitleCaseTR(data.city),
                storeName: data.storeName,
                salesPerson: data.salesPerson,
                customerName: toTitleCaseTR(data.customerName || ''),
                customerContact: data.customerContact,
                customerId: customerId, // Link to customer
                item: data.item,
                price: data.price,
                quantity: data.quantity,
                total: data.total,
                profit: data.profit,
                isShipped: data.isShipped || false,
                status: data.status || 'APPROVED',
                description: data.description,
                orderNumber: orderNumber // Assign generated number
            }
        })
        revalidatePath('/')
        revalidatePath('/sales')
        revalidatePath('/admin/orders')

        // Convert Decimals for client
        const serializedSale = {
            ...newSale,
            date: newSale.date.toISOString().split('T')[0],
            createdAt: newSale.createdAt.toISOString(),
            updatedAt: newSale.updatedAt.toISOString(),
            customerName: newSale.customerName || '',
            customerContact: newSale.customerContact || '',
            profit: newSale.profit.toNumber(),
            description: newSale.description || '',
            orderNumber: newSale.orderNumber || ''
        }

        // Send Notification (Fire & Forget)
        sendNewOrderEmailToAdmins(newSale.id).catch(err => console.error("Failed to send notification:", err));

        return { success: true, data: serializedSale }
    } catch (error) {
        console.error("Failed to create sale:", error)
        return { success: false, error: "Failed to create sale" }
    }
}


export async function createBatchSale(sales: SaleDTO[]) {
    try {
        if (sales.length === 0) return { success: false, error: "No items in batch" };

        let customerId = sales[0].customerId;
        const customerName = sales[0].customerName;

        // Auto-link logic (simplified reuse from createSale or just trust the first item's resolution)
        if (customerName && !customerId) {
            const existingCustomer = await prisma.customer.findFirst({ where: { name: customerName } });
            if (existingCustomer) {
                customerId = existingCustomer.id;
            } else {
                const newCustomer = await prisma.customer.create({
                    data: {
                        name: customerName,
                        contactName: customerName,
                        city: sales[0].city,
                        storeCode: sales[0].storeCode !== 'ONLINE' ? sales[0].storeCode : undefined,
                    }
                });
                customerId = newCustomer.id;
            }
        }

        const createdSales = await prisma.$transaction(
            sales.map(data => prisma.sale.create({
                data: {
                    date: new Date(data.date),
                    storeCode: data.storeCode,
                    region: toTitleCaseTR(data.region),
                    city: toTitleCaseTR(data.city),
                    storeName: data.storeName,
                    salesPerson: data.salesPerson,
                    customerName: toTitleCaseTR(data.customerName || ''),
                    customerContact: data.customerContact,
                    customerId: customerId,
                    item: data.item, // Product Name
                    price: data.price,
                    quantity: data.quantity,
                    total: data.total,
                    profit: data.profit,
                    isShipped: false,
                    status: 'PENDING',
                    description: data.description,
                }
            }))
        );

        // Send Batch Notification
        // We'll implement a batch email trigger here
        // sendBatchOrderEmailToAdmins(createdSales).catch(console.error);
        if (createdSales.length > 0) {
            // For now, simpler: trigger individual for first one or just one summary
            // Implementing summary is better.
            // I'll call a new notification function.
            sendBatchOrderEmailToAdmins(createdSales).catch(err => console.error("Batch email failed", err));
        }

        revalidatePath('/');
        return { success: true, count: createdSales.length };
    } catch (error) {
        console.error("Failed to create batch sale:", error);
        return { success: false, error: "Toplu sipariş oluşturulamadı." };
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

        // Serialize for client
        const serializedSale = {
            ...updatedSale,
            date: updatedSale.date.toISOString().split('T')[0],
            createdAt: updatedSale.createdAt.toISOString(),
            updatedAt: updatedSale.updatedAt.toISOString(),
            customerName: updatedSale.customerName || '',
            customerContact: updatedSale.customerContact || '',
            price: updatedSale.price.toNumber(),
            total: updatedSale.total.toNumber(),
            profit: updatedSale.profit.toNumber(),
            description: updatedSale.description || '',
            waybillNumber: updatedSale.waybillNumber || '',
            invoiceNumber: updatedSale.invoiceNumber || '',
            paymentStatus: updatedSale.paymentStatus || '',
        }

        revalidatePath('/')
        return { success: true, data: serializedSale }
    } catch (error) {
        console.error("Failed to update sale:", error)
        return { success: false, error: "Failed to update sale" }
    }
}

export async function deleteSale(id: string) {
    try {
        // Soft delete: set deletedAt to now
        await prisma.sale.update({
            where: { id },
            data: {
                deletedAt: new Date()
            }
        })
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error("Failed to delete sale:", error)
        return { success: false, error: "Failed to delete sale" }
    }
}


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
    }
}

export async function getMonthlyTarget(month: number, year: number) {
    'use server';
    try {
        const target = await prisma.monthlyTarget.findUnique({
            where: {
                month_year: {
                    month,
                    year
                }
            }
        });
        return target ? { target: target.target.toNumber(), success: target.success?.toNumber() || 0 } : null;
    } catch (error) {
        console.error("Failed to fetch monthly target:", error);
        return null;
    }
}

// Cleanup old pending orders (> 2 months)
export async function checkAndCleanupOldOrders() {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        return { count: 0, message: 'Unauthorized' };
    }

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    try {
        const result = await prisma.sale.updateMany({
            where: {
                isShipped: false,
                date: {
                    lt: twoMonthsAgo
                }
            },
            data: {
                isShipped: true,
                paymentStatus: 'PAID' // Assume paid if auto-closed after 2 months
            }
        });

        if (result.count > 0) {
            revalidatePath('/admin/orders');
            revalidatePath('/sales');
            revalidatePath('/');
        }

        return { count: result.count, message: 'Success' };
    } catch (error) {
        console.error('Cleanup error:', error);
        return { count: 0, message: 'Error' };
    }
}
