'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

export type CustomerDTO = {
    id?: string
    name: string
    city?: string
    storeCode?: string
    contactName?: string
    phone?: string
    email?: string
}

export async function getCustomers() {
    try {
        const customers = await prisma.customer.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { sales: true }
                }
            }
        })
        return customers
    } catch (error) {
        console.error("Failed to fetch customers:", error)
        return []
    }
}

export async function createCustomer(data: CustomerDTO) {
    try {
        const customer = await prisma.customer.create({
            data: {
                name: data.name,
                city: data.city,
                storeCode: data.storeCode,
                contactName: data.contactName,
                phone: data.phone,
                email: data.email
            }
        })
        revalidatePath('/admin/customers')
        return { success: true, data: customer }
    } catch (error) {
        console.error("Failed to create customer:", error)
        return { success: false, error: "Failed to create customer" }
    }
}

export async function updateCustomer(id: string, data: Partial<CustomerDTO>) {
    try {
        const customer = await prisma.customer.update({
            where: { id },
            data
        })
        revalidatePath('/admin/customers')
        return { success: true, data: customer }
    } catch (error) {
        console.error("Failed to update customer:", error)
        return { success: false, error: "Failed to update customer" }
    }
}

export async function deleteCustomer(id: string) {
    try {
        await prisma.customer.delete({
            where: { id }
        })
        revalidatePath('/admin/customers')
        return { success: true }
    } catch (error) {
        console.error("Failed to delete customer:", error)
        return { success: false, error: "Failed to delete customer" }
    }
}

// Import customers from the existing CSV
export async function importCustomersFromCSV() {
    try {
        const csvPath = path.join(process.cwd(), 'CHECKLİST 2025 - 2024 January.csv');
        const fileContent = fs.readFileSync(csvPath, 'utf-8');

        const records = parse(fileContent, {
            columns: false,
            skip_empty_lines: true,
            from_line: 10 // Start from data lines
        });

        let count = 0;
        const uniqueStores = new Set<string>();

        // First pass: identify unique stores
        for (const record of records) {
            // Index 3: City, Index 4: Store
            const city = record[3]?.trim();
            const storeName = record[4]?.trim();

            if (storeName && !uniqueStores.has(storeName)) {
                uniqueStores.add(storeName);

                // Check if already exists to avoid duplicates on re-run
                const existing = await prisma.customer.findFirst({
                    where: { name: storeName }
                });

                if (!existing) {
                    await prisma.customer.create({
                        data: {
                            name: storeName,
                            city: city,
                            storeCode: '', // No code in CSV
                            contactName: '', // Could be 'Purchase' column (index 5) but that looks like Sales Person
                        }
                    });
                    count++;
                }
            }
        }
        revalidatePath('/admin/customers');
        return { success: true, count };

    } catch (error) {
        console.error("Failed to import customers:", error);
        return { success: false, error: "Failed to import customers from CSV" };
    }
}
// Helper to get customer profile
export async function getCustomerProfile(name: string) {
    try {
        const customer = await prisma.customer.findFirst({
            where: { name }
        });

        if (!customer) return null;

        let region = '';
        if (customer.storeCode) {
            const store = await prisma.store.findUnique({
                where: { code: customer.storeCode }
            });
            if (store) region = store.region;
        }

        return {
            ...customer,
            region // Add derived region
        };
    } catch (error) {
        console.error("Failed to fetch customer profile:", error);
        return null;
    }
}

export async function getStoreCodes() {
    try {
        const stores = await prisma.store.findMany({
            select: { code: true },
            orderBy: { code: 'asc' }
        });
        return stores.map(s => s.code);
    } catch (error) {
        console.error("Failed to fetch store codes:", error);
        return [];
    }
}
