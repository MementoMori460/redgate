'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'
import * as XLSX from 'xlsx';
import { normalizeCityName } from '../utils/city-normalization';
import { auth } from "@/auth";

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
            select: {
                code: true,
                name: true,
                city: true
            },
            orderBy: { code: 'asc' }
        });
        return stores;
    } catch (error) {
        console.error("Failed to fetch store codes:", error);
        return [];
    }
}


// Helper for Turkish Title Case
function toTitleCaseTR(str: string) {
    if (!str) return str;
    return str.replace(/[\w\u00C0-\u017F]+/g, (txt) => {
        return txt.charAt(0).toLocaleUpperCase('tr-TR') + txt.slice(1).toLocaleLowerCase('tr-TR');
    });
}

export async function importCustomersFromExcel(formData: FormData) {
    const session = await auth();
    if (session?.user?.role !== 'admin') {
        return { success: false, message: 'Unauthorized' };
    }

    try {
        const file = formData.get('file') as File;
        if (!file) return { success: false, message: 'No file provided' };

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        // codepage: 65001 ensures UTF-8 is used if it's a CSV or text format
        const workbook = XLSX.read(buffer, { type: 'buffer', codepage: 65001 });

        // Use the first sheet usually named 'Mağazalar'
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

        let totalProcessed = 0;
        let createdCount = 0;
        let updatedCount = 0;

        // Row 0 has the Job Titles (Headers)
        const headerRow = rows[0] as string[];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 3) continue;

            const col1 = row[1]?.toString()?.trim(); // Store Code (T079)
            const col2 = row[2]?.toString()?.trim(); // Store Name (İstanbul Brandium Avm)
            const col3 = row[3]?.toString()?.trim(); // City | Mall

            // Valid Store Row check
            if (col1 && /^[TSM]\d{3,4}$/i.test(col1) && col2) {
                const storeCode = col1.toUpperCase();
                const storeName = col2;

                // --- CITY LOGIC ---
                // Try Row i (col3) first
                let rawCityText = col3 || '';

                // Look at Row i+2 (Address 2) for City info
                const rowPlus2 = rows[i + 2];
                if (rowPlus2 && rowPlus2[3]) {
                    rawCityText += ' ' + rowPlus2[3].toString();
                }

                // Explicitly look for " | " pattern in Row i
                let cityCandidates = [];
                if (col3 && col3.includes('|')) {
                    cityCandidates.push(col3.split('|')[0].trim());
                }

                // Add the composite text
                cityCandidates.push(rawCityText);

                let normalizedCity = 'Unknown';
                for (const candidate of cityCandidates) {
                    const norm = normalizeCityName(candidate);
                    if (norm !== 'Unknown') {
                        normalizedCity = norm;
                        break;
                    }
                }
                // Fallback: If still unknown, and we have a " - " in row+2, try separate by dash
                if (normalizedCity === 'Unknown' && rowPlus2 && rowPlus2[3]) {
                    const parts = rowPlus2[3].toString().split('-');
                    if (parts.length > 1) {
                        const potentialCity = parts[parts.length - 1].trim();
                        normalizedCity = normalizeCityName(potentialCity);
                    }
                }

                // --- CONTACTS LOGIC ---
                // Iterate Columns E (4) to R (17)
                for (let colIdx = 4; colIdx <= 17; colIdx++) {
                    const rawName = row[colIdx]?.toString()?.trim();
                    if (!rawName || rawName.length < 2) continue;
                    if (['boş', '-', 'vacant', 'open', 'kapalı'].includes(rawName.toLowerCase())) continue;

                    // Normalize Name: "Rıdvan UYsal" -> "Rıdvan Uysal"
                    const personName = toTitleCaseTR(rawName);

                    const jobTitle = headerRow[colIdx]?.toString()?.trim() || 'Yetkili';

                    // Look for Phone/Email in next 2 rows at same column
                    let phone = undefined;
                    let email = undefined;

                    // Helper to identify content
                    const identify = (val: string) => {
                        if (!val) return null;
                        if (val.includes('@')) return 'email';
                        // Matches typical phone logic (digits > 7)
                        const digits = val.replace(/\D/g, '');
                        if (digits.length > 7) return 'phone';
                        return 'other';
                    };

                    const val1 = rows[i + 1]?.[colIdx]?.toString()?.trim();
                    const val2 = rows[i + 2]?.[colIdx]?.toString()?.trim();

                    const item1 = identify(val1);
                    const item2 = identify(val2);

                    if (item1 === 'email') email = val1;
                    if (item1 === 'phone') phone = val1;

                    if (item2 === 'email') email = val2;
                    if (item2 === 'phone') phone = val2;

                    // Upsert Customer (Person)
                    const existing = await prisma.customer.findFirst({
                        where: { name: personName }
                    });

                    const contactInfo = `${jobTitle} - ${storeName}`;

                    if (existing) {
                        await prisma.customer.update({
                            where: { id: existing.id },
                            data: {
                                storeCode: storeCode, // Update store code to current
                                city: normalizedCity !== 'Unknown' ? normalizedCity : undefined,
                                contactName: contactInfo,
                                phone: phone || undefined,
                                email: email || undefined
                            }
                        });
                        updatedCount++;
                    } else {
                        await prisma.customer.create({
                            data: {
                                name: personName,
                                storeCode: storeCode,
                                city: normalizedCity !== 'Unknown' ? normalizedCity : null,
                                contactName: contactInfo,
                                phone: phone,
                                email: email
                            }
                        });
                        createdCount++;
                    }
                    totalProcessed++;
                }
            }
        }

        revalidatePath('/admin/customers');
        return {
            success: true,
            message: `İşlem Tamamlandı:\n- Toplam Bulunan: ${totalProcessed}\n- Yeni Eklenen: ${createdCount}\n- Güncellenen: ${updatedCount}`
        };

    } catch (error) {
        console.error("Import customers error:", error);
        return { success: false, message: `Hata: ${(error as any).message}` };
    }
}

