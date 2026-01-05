'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

// Helper for robust date parsing
function safeParseDate(val: any): Date | null {
    if (!val) return null;

    // 1. Excel Serial Number
    if (typeof val === 'number') {
        // Excel serial date: days since 1900-01-01 (approx)
        // Adjust for Excel leap year bug (1900 considered leap year)
        // 25569 = Days between 1900-01-01 and 1970-01-01
        return new Date(Math.round((val - 25569) * 86400 * 1000));
    }

    // 2. String Parsing
    if (typeof val === 'string') {
        const trimmed = val.trim();

        // Try standard Date parse first (ISO, MM/DD/YYYY)
        let d = new Date(trimmed);
        if (!isNaN(d.getTime())) return d;

        // Try DD.MM.YYYY (Turkish/Euro format), handling typo chars like 'i' instead of '.'
        // Also handle "6 digits" or missing separators if needed, but '27.11i2024' case is specific
        // Replace potential typo separators with dot
        const normalized = trimmed.replace(/[i\-\/]/g, '.');
        const dmY = normalized.match(/^(\d{1,2})[.](\d{1,2})[.](\d{4})$/);

        if (dmY) {
            return new Date(parseInt(dmY[3]), parseInt(dmY[2]) - 1, parseInt(dmY[1]));
        }
    }

    return null;
}


import { normalizeCityName } from '../utils/city-normalization';

export async function importChecklistData(formData?: FormData) {
    const session = await auth();
    const role = session?.user?.role?.toLowerCase();

    // Allow admin and maybe other trusted roles if needed
    if (role !== 'admin') {
        return { success: false, message: 'Unauthorized (Role: ' + (session?.user?.role || 'None') + ')' };
    }

    try {
        let workbook;

        // 1. Check for uploaded file
        const file = formData?.get('file') as File;
        if (file) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            workbook = XLSX.read(buffer, { type: 'buffer' });
            console.log(`Loaded workbook from upload: ${file.name}`);
        } else {
            // 2. Fallback to server filesystem
            const filePath = path.join(process.cwd(), 'checklist.xlsx');
            try {
                const fileBuffer = fs.readFileSync(filePath);
                workbook = XLSX.read(fileBuffer, { type: 'buffer' });
                console.log(`Loaded workbook from server filesystem: ${filePath}`);
            } catch (e) {
                console.error('XLSX Read Error:', e);
                throw new Error(`Dosya bulunamadı veya okunamadı: ${filePath}. Lütfen dosya yükleyiniz.`);
            }
        }

        let totalCount = 0;
        let createdCustomers = 0;
        let errors = [];

        // Filter valid sheets (e.g. "2024 January", "2025 March")
        const validSheets = workbook.SheetNames.filter(name =>
            /^(202[0-9])\s+(January|February|March|April|May|June|July|August|September|October|November|December)$/i.test(name)
        );

        console.log(`Found ${validSheets.length} valid sheets:`, validSheets);

        for (const sheetName of validSheets) {
            const sheet = workbook.Sheets[sheetName];
            // Get data as array of arrays
            const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

            // Find Header Row and Map Columns
            let headerIndex = -1;
            let colMap: Record<string, number> = {};

            for (let i = 0; i < Math.min(rows.length, 20); i++) {
                const row = rows[i];
                if (!row) continue;

                // Convert row to string array for searching
                const rowStrs = row.map(c => c?.toString().trim().toLowerCase() || '');

                // Identify header by key columns
                const hasDate = rowStrs.some(s => s === 'date' || s === 'tarih');
                const hasCity = rowStrs.some(s => s === 'city' || s === 'şehir' || s === 'sehir');
                const hasStore = rowStrs.some(s => s === 'store' || s === 'mağaza' || s === 'magaza');

                if (hasDate && (hasCity || hasStore)) {
                    headerIndex = i;

                    // Build map
                    rowStrs.forEach((colName, idx) => {
                        if (colName === 'date' || colName === 'tarih') colMap.date = idx;
                        else if (colName === 'city' || colName === 'şehir' || colName === 'sehir') colMap.city = idx;
                        else if (colName === 'store' || colName === 'mağaza' || colName === 'magaza') colMap.store = idx;
                        // Store Code
                        else if (colName === 'store code' || colName === 'mağaza kodu' || colName === 'magaza kodu' || colName === 'code' || colName === 'kod') colMap.storeCode = idx;

                        // Customer: Capture first match only to prevent "Purchase" (Item) overwriting "Purchase" (Cust)
                        else if (colMap.customer === undefined && (colName === 'purchaser' || colName === 'satın alan' || colName === 'personel' || colName === 'salesperson' || colName === 'purchase')) colMap.customer = idx;

                        // Item matches: item, ürün, explanation, desc, product
                        else if (colName === 'item' || colName === 'ürün' || colName === 'urun' || colName === 'açıklama' || colName === 'description' || colName === 'product') colMap.item = idx;
                        else if (colName === 'quantity' || colName === 'adet' || colName === 'miktar') colMap.quantity = idx;
                        else if (colName === 'price' || colName === 'birim fiyat' || colName === 'fiyat') colMap.price = idx;
                        else if (colName === 'total' || colName === 'toplam' || colName === 'tutar') colMap.total = idx;
                        else if (colName === 'profit' || colName === 'net kar' || colName === 'kar') colMap.profit = idx;
                        // Waybill (İrsaliye)
                        else if (colMap.waybill === undefined && (colName === 'waybill' || colName === 'irsaliye' || colName === 'irsaliye no' || colName === 'sevk irsaliye' || colName === 'sevk')) colMap.waybill = idx;

                        // Invoice (Fatura)
                        else if (colMap.invoice === undefined && (colName === 'invoice' || colName === 'fatura' || colName === 'fatura no' || colName === 'invoice no')) colMap.invoice = idx;
                    });

                    console.log(`Sheet ${sheetName}: Found Header at row ${i}. Map:`, colMap);
                    break;
                }
            }

            if (headerIndex === -1) {
                console.warn(`Could not find header in sheet ${sheetName}`);
                errors.push(`${sheetName}: Header not found`);
                continue;
            }

            // INFERENCE: If specific columns are missing, infer from known structure
            // Typical structure: [..., Store, Purchase, Item (Empty Header), Unit, Quantity, Price, Total]

            if (colMap.customer !== undefined && colMap.item === undefined) {
                // Item is usually next to customer
                colMap.item = colMap.customer + 1;
                console.log(`Sheet ${sheetName}: Inferred Item column at ${colMap.item}`);
            }

            if (colMap.item !== undefined && colMap.quantity === undefined) {
                // Quantity is often item + 2 (skipping Unit "Adet")
                colMap.quantity = colMap.item + 2;
                console.log(`Sheet ${sheetName}: Inferred Quantity column at ${colMap.quantity}`);
            }

            if (colMap.quantity !== undefined && colMap.price === undefined) {
                colMap.price = colMap.quantity + 1;
                console.log(`Sheet ${sheetName}: Inferred Price column at ${colMap.price}`);
            }

            if (colMap.price !== undefined && colMap.total === undefined) {
                colMap.total = colMap.price + 1;
                console.log(`Sheet ${sheetName}: Inferred Total column at ${colMap.total}`);
            }

            // Fallback for essential dates if still missing (unlikely if header found)
            if (colMap.date === undefined) colMap.date = 2;

            // Data starts after header
            for (let i = headerIndex + 1; i < rows.length; i++) {
                const row = rows[i];
                // Check mapped date index
                if (!row || !row[colMap.date]) continue;

                try {
                    // Safe Date Parsing using Mapped Index
                    const saleDate = safeParseDate(row[colMap.date]);

                    if (!saleDate || isNaN(saleDate.getTime())) {
                        continue; // Skip invalid date rows
                    }

                    // STRICT RESTRICTION: Only allow 2026 and later
                    if (saleDate.getFullYear() < 2026) {
                        // console.log(`Skipping old date: ${saleDate.getFullYear()}`);
                        continue;
                    }

                    const rawCity = colMap.city !== undefined ? (row[colMap.city]?.toString() || 'Unknown') : 'Unknown';
                    const city = normalizeCityName(rawCity);
                    const storeName = colMap.store !== undefined ? (row[colMap.store]?.toString() || 'Unknown') : 'Unknown';
                    const customerName = colMap.customer !== undefined ? (row[colMap.customer]?.toString() || 'Unknown') : 'Unknown';
                    const item = colMap.item !== undefined ? (row[colMap.item]?.toString() || 'Unknown') : 'Unknown';
                    const quantity = colMap.quantity !== undefined ? (parseInt(row[colMap.quantity]) || 1) : 1;
                    const price = colMap.price !== undefined ? (parseFloat(row[colMap.price]) || 0) : 0;
                    const total = colMap.total !== undefined ? (parseFloat(row[colMap.total]) || 0) : 0;
                    const profit = colMap.profit !== undefined ? (parseFloat(row[colMap.profit]) || 0) : 0;

                    // Compute Final Store Code EARLY
                    const rawStoreCode = colMap.storeCode !== undefined ? (row[colMap.storeCode]?.toString() || '') : '';
                    let finalStoreCode = rawStoreCode.trim();
                    if (!finalStoreCode || finalStoreCode.length < 2) {
                        finalStoreCode = storeName.toUpperCase().substring(0, 3) + "001";
                    }

                    // READ NEW FIELDS
                    const waybillNumber = colMap.waybill !== undefined ? (row[colMap.waybill]?.toString() || null) : null;
                    const invoiceNumber = colMap.invoice !== undefined ? (row[colMap.invoice]?.toString() || null) : null;

                    if (!item || !storeName) continue;

                    // 1. Find or Upsert Customer
                    let customerId = undefined;

                    if (customerName && customerName !== 'Unknown') {
                        // Check if exists
                        const existingCustomer = await prisma.customer.findFirst({
                            where: { name: customerName }
                        });

                        if (existingCustomer) {
                            customerId = existingCustomer.id;
                            // Update details if missing or changed? 
                            // Let's rely on latest import for city/store link, but be careful not to overwrite valid data with 'Unknown'
                            if (city !== 'Unknown' && storeName !== 'Unknown') {
                                await prisma.customer.update({
                                    where: { id: existingCustomer.id },
                                    data: {
                                        city: city,
                                        storeCode: finalStoreCode !== 'Unknown' ? finalStoreCode : undefined
                                    }
                                });
                            }
                        } else {
                            // Create new customer
                            const newCust = await prisma.customer.create({
                                data: {
                                    name: customerName,
                                    city: city !== 'Unknown' ? city : null,
                                    storeCode: (finalStoreCode && finalStoreCode !== 'Unknown') ? finalStoreCode : null,
                                    contactName: customerName,
                                }
                            });
                            customerId = newCust.id;
                            createdCustomers++;
                        }
                    }

                    // 2. Find or Upsert Product
                    if (item && item !== 'Unknown') {
                        const existingProduct = await prisma.product.findUnique({
                            where: { name: item }
                        });

                        if (existingProduct) {
                            // Update Price if this import has a price (and it's newer/different?)
                            // We just set it to the latest seen price for now. 
                            if (price > 0) {
                                await prisma.product.update({
                                    where: { id: existingProduct.id },
                                    data: { price: price }
                                });
                            }
                        } else {
                            // Create Record
                            // Find highest existing PRD number to increment
                            // This is inefficient inside a loop, but safe for now. 
                            // For bulk imports, we should fetch max once and increment locally.

                            // Optimization: We could fetch all product numbers once at start, but let's do safe strict find for now
                            // OR: Use a helper unique string that we know is safe, but user wants PRD-0001 sequence.
                            // Let's rely on a helper function or catch collision?
                            // Better: Fetch last created product with name starting with PRD-

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

                            // Pad with zeros (PRD-0001)
                            const pNum = `PRD-${nextNum.toString().padStart(4, '0')}`;

                            await prisma.product.create({
                                data: {
                                    name: item,
                                    productNumber: pNum, // Required unique
                                    price: price > 0 ? price : 0
                                }
                            });
                        }
                    }

                    // DEDUPLICATION: Check if this exact sale already exists
                    // We define "uniqueness" by: Date, Store, Customer, Item
                    const existingSale = await prisma.sale.findFirst({
                        where: {
                            date: saleDate,
                            storeName: storeName,
                            customerName: customerName,
                            item: item,
                        }
                    });

                    const saleData = {
                        date: saleDate,
                        storeCode: finalStoreCode,
                        city: city,
                        region: city,
                        storeName: storeName,
                        salesPerson: "System Import",
                        customerName: customerName,
                        customerId: customerId,
                        item: item,
                        price: price,
                        quantity: quantity,
                        total: total,
                        profit: profit,
                        isShipped: !!waybillNumber || true, // Set to true if waybill exists, or default true for imported (old behavior was true)
                        // Actually, old behavior was 'isShipped: true'.
                        // Let's keep it true by default for 'Legacy Import', unless user explicitly wants 'Pending'?
                        // Import usually implies past sales, so Shipped is safe. 
                        // But now `waybillNumber` enriches it.
                        waybillNumber: waybillNumber,
                        invoiceNumber: invoiceNumber,
                        paymentStatus: invoiceNumber ? 'PAID' : 'UNPAID', // Infer payment from invoice presence?
                    };

                    if (existingSale) {
                        // UPDATE existing record
                        await prisma.sale.update({
                            where: { id: existingSale.id },
                            data: saleData
                        });
                    } else {
                        // CREATE new record
                        await prisma.sale.create({
                            data: saleData
                        });
                    }

                    totalCount++;

                } catch (e) {
                    // console.error(`Error processing row ${i} in ${sheetName}:`, e);
                    if (errors.length < 50) errors.push(`${sheetName} Row ${i}: ${(e as any).message}`);
                }
            }
        }

        return {
            success: true,
            message: `Başarıyla ${totalCount} satış aktarıldı. ${createdCustomers} yeni müşteri oluşturuldu. (Hatalı/Atlanan: ${errors.length})`
        };

    } catch (error) {
        console.error("Import error:", error);
        return { success: false, message: `Import failed: ${(error as any).message}` };
    }
}
