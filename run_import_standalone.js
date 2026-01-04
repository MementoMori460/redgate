const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const prisma = new PrismaClient();

// Helper for robust date parsing
function safeParseDate(val) {
    if (!val) return null;

    if (typeof val === 'number') {
        const d = new Date(Math.round((val - 25569) * 86400 * 1000));
        d.setUTCHours(12, 0, 0, 0); // Force Noon UTC
        return d;
        if (val instanceof Date) return val;
        val = val.toString().trim();

        // Excel number date (approximate check, > 20000)
        if (!isNaN(val) && parseFloat(val) > 20000 && val.length < 6) {
            // Simple Excel serial date conversion
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + parseFloat(val) * 86400000);
            return date;
        }

        // DD.MM.YYYY or DD/MM/YYYY
        // Regex for DD.MM.YYYY or DD/MM/YYYY
        const dmy = val.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
        if (dmy) {
            return new Date(Date.UTC(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1])));
        }

        const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
        dateObj.setUTCHours(12, 0, 0, 0); // Force Noon UTC
        return dateObj;
    }

    if (val instanceof Date) return val;
    val = val.toString().trim();

    // Excel number date (approximate check, > 20000)
    if (!isNaN(val) && parseFloat(val) > 20000 && val.length < 6) {
        // Simple Excel serial date conversion
        const excelEpoch = new Date(1899, 11, 30);
        const dateObj = new Date(excelEpoch.getTime() + parseFloat(val) * 86400000);
        return dateObj;
    }

    // DD.MM.YYYY or DD/MM/YYYY
    // Regex for DD.MM.YYYY or DD/MM/YYYY
    const dmy = val.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
    if (dmy) {
        return new Date(Date.UTC(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1])));
    }

    // YYYY-MM-DD
    const ymd = val.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (ymd) {
        return new Date(Date.UTC(parseInt(ymd[1]), parseInt(ymd[2]) - 1, parseInt(ymd[3])));
    }

    const dateObj = new Date(val);
    if (!isNaN(dateObj.getTime())) return dateObj;
    return null;
}

function normalizeCityName(city) {
    if (!city) return 'Bilinmiyor';
    city = city.toString().trim();
    const map = {
        'ı': 'i', 'İ': 'I', 'ş': 's', 'Ş': 'S', 'ğ': 'g', 'Ğ': 'G', 'ü': 'u', 'Ü': 'U', 'ö': 'o', 'Ö': 'O', 'ç': 'c', 'Ç': 'C'
    };
    return city.replace(/[ıİşŞğĞüÜöÖçÇ]/g, (char) => map[char] || char)
        .replace(/[^a-zA-Z\s]/g, '')
        .trim()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

async function importChecklistData() {
    try {
        const filePath = path.join(process.cwd(), 'checklist.xlsx');
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            return;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

        let totalCount = 0;
        let createdCustomers = 0;
        let errors = [];

        const validSheets = workbook.SheetNames.filter(name =>
            /^(202[0-9])\s+(January|February|March|April|May|June|July|August|September|October|November|December)$/i.test(name)
        );

        console.log(`Found ${validSheets.length} valid sheets:`, validSheets);

        // OPTIMIZATION: Pre-fetch Customers and Products to minimize DB calls
        console.log('Pre-fetching Customers and Products for cache...');
        const allCustomers = await prisma.customer.findMany();
        const customerCache = new Map(allCustomers.map(c => [c.name.trim().toLowerCase(), c]));

        const allProducts = await prisma.product.findMany();
        const productCache = new Map(allProducts.map(p => [p.name.trim().toLowerCase(), p]));

        let createdProducts = 0;

        // Get initial max product number
        const lastProduct = await prisma.product.findFirst({
            where: { productNumber: { startsWith: 'PRD-' } },
            orderBy: { productNumber: 'desc' }
        });
        let currentMaxPrdNum = 0;
        if (lastProduct) {
            const match = lastProduct.productNumber.match(/PRD-(\d+)/);
            if (match) currentMaxPrdNum = parseInt(match[1]);
        }

        for (const sheetName of validSheets) {
            // SKIP JAN 2026 to protect manual data entry
            if (sheetName.includes('2026') && (sheetName.includes('January') || sheetName.includes('Ocak'))) {
                console.log(`Skipping ${sheetName} to protect manually seeded data.`);
                continue;
            }

            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: null });

            let headerIndex = -1;
            let colMap = {};

            for (let i = 0; i < Math.min(rows.length, 20); i++) {
                const row = rows[i];
                if (!row) continue;
                const rowStrs = row.map(c => c?.toString().trim().toLowerCase() || '');

                const hasDate = rowStrs.some(s => s === 'date' || s === 'tarih');
                const hasCity = rowStrs.some(s => s === 'city' || s === 'şehir' || s === 'sehir');
                const hasStore = rowStrs.some(s => s === 'store' || s === 'mağaza' || s === 'magaza');

                if (hasDate && (hasCity || hasStore)) {
                    headerIndex = i;

                    // Look at previous row for additional headers (merged headers case)
                    const prevRow = i > 0 ? rows[i - 1] : [];
                    const prevRowStrs = prevRow ? prevRow.map(c => c?.toString().trim().toLowerCase() || '') : [];

                    // Helper to check both rows
                    const checkCol = (patterns, idx) => {
                        const curr = rowStrs[idx] || '';
                        const prev = prevRowStrs[idx] || '';
                        return patterns.some(p => curr.includes(p) || prev.includes(p));
                    };

                    rowStrs.forEach((colName, idx) => {
                        if (colName === 'date' || colName === 'tarih') colMap.date = idx;
                        else if (colName === 'city' || colName === 'şehir' || colName === 'sehir') colMap.city = idx;
                        else if (colName === 'store' || colName === 'mağaza' || colName === 'magaza') colMap.store = idx;
                        else if (colName === 'store code' || colName === 'mağaza kodu' || colName === 'magaza kodu' || colName === 'code' || colName === 'kod') colMap.storeCode = idx;

                        else if (colMap.customer === undefined && (colName === 'purchaser' || colName === 'satın alan' || colName === 'personel' || colName === 'salesperson' || colName === 'purchase')) colMap.customer = idx;

                        else if (colName === 'item' || colName === 'ürün' || colName === 'urun' || colName === 'açıklama' || colName === 'description' || colName === 'product') colMap.item = idx;
                        else if (colName === 'quantity' || colName === 'adet' || colName === 'miktar') colMap.quantity = idx;
                        else if (colName === 'price' || colName === 'birim fiyat' || colName === 'fiyat') colMap.price = idx;
                        else if (colName === 'total' || colName === 'toplam' || colName === 'tutar') colMap.total = idx;
                        else if (colName === 'profit' || colName === 'net kar' || colName === 'kar') colMap.profit = idx;

                        // Check previous row for Waybill/Invoice
                        // Also check current row just in case
                        if (colMap.waybill === undefined) {
                            if (checkCol(['irsaliye no', 'irsaliye'], idx)) colMap.waybill = idx;
                            else if (checkCol(['waybill', 'sevk irsaliye'], idx)) colMap.waybill = idx;
                            // Explicitly ignore 'sevk durumu' by ensuring it's not just 'sevk'
                            else if (colName.includes('sevk') && !colName.includes('durumu') && !colName.includes('status')) colMap.waybill = idx;
                        }

                        if (colMap.invoice === undefined) {
                            if (checkCol(['invoice', 'fatura'], idx)) colMap.invoice = idx;
                        }
                    });
                    // Don't break here, continue to find targets in other rows
                }
            }

            if (headerIndex === -1) {
                console.warn(`Could not find header in sheet ${sheetName}`);
                continue;
            }

            // Inference logic
            if (colMap.customer !== undefined && colMap.item === undefined) colMap.item = colMap.customer + 1;
            if (colMap.item !== undefined && colMap.quantity === undefined) colMap.quantity = colMap.item + 2;
            if (colMap.quantity !== undefined && colMap.price === undefined) colMap.price = colMap.quantity + 1;
            if (colMap.price !== undefined && colMap.total === undefined) colMap.total = colMap.price + 1;

            // 1. Wipe existing data for this Month/Year to ensure clean slate
            // Extract Year/Month from Sheet Name
            let sheetMonth = -1;
            let sheetYear = -1;

            const yearMatch = sheetName.match(/^(\d{4})/);
            if (yearMatch) sheetYear = parseInt(yearMatch[1]);

            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const trMonths = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

            months.forEach((m, idx) => { if (sheetName.includes(m)) sheetMonth = idx; });
            if (sheetMonth === -1) {
                trMonths.forEach((m, idx) => { if (sheetName.includes(m)) sheetMonth = idx; });
            }

            // 1. Wipe existing data for this Month/Year to ensure clean slate
            if (sheetYear !== -1 && sheetMonth !== -1) {
                console.log(`Clearing existing data for ${sheetYear}-${sheetMonth + 1}...`);
                const startDate = new Date(Date.UTC(sheetYear, sheetMonth, 1));
                const endDate = new Date(Date.UTC(sheetYear, sheetMonth + 1, 1)); // First day of next month

                await prisma.sale.deleteMany({
                    where: {
                        date: {
                            gte: startDate,
                            lt: endDate
                        }
                    }
                });
            }

            // 2. Parse Targets from Header Rows (0-10)
            let turnoverTarget = 0;
            let successValue = 0;

            for (let i = 0; i < Math.min(rows.length, 10); i++) {
                const r = rows[i];
                if (!r) continue;
                const strRow = r.map(c => c?.toString().toLowerCase() || '');

                // Find "Turnover Target"
                const targetIdx = strRow.findIndex(c => c.includes('turnover target') || c.includes('hedef'));
                if (targetIdx !== -1) {
                    if (r[targetIdx + 1] && typeof r[targetIdx + 1] === 'number') turnoverTarget = r[targetIdx + 1];
                }

                // Find "Success"
                const successIdx = strRow.findIndex(c => c.includes('success') || c.includes('başarı'));
                if (successIdx !== -1) {
                    if (r[successIdx + 1] && typeof r[successIdx + 1] === 'number') successValue = r[successIdx + 1];
                }
            }

            // UPSERT TARGET if found
            if (sheetYear !== -1 && sheetMonth !== -1 && turnoverTarget > 0) {
                console.log(`Upserting Target for ${sheetYear}-${sheetMonth + 1}: Target=${turnoverTarget}, Success=${successValue}`);
                await prisma.monthlyTarget.upsert({
                    where: {
                        month_year: {
                            month: sheetMonth + 1,
                            year: sheetYear
                        }
                    },
                    update: {
                        target: turnoverTarget,
                        success: successValue > 0 ? successValue : undefined
                    },
                    create: {
                        month: sheetMonth + 1,
                        year: sheetYear,
                        target: turnoverTarget,
                        success: successValue > 0 ? successValue : undefined
                    }
                });
            }

            // ... Original Column Mapping Logic ... (unchanged below)
            if (colMap.date === undefined) colMap.date = 2;

            for (let i = headerIndex + 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || !row[colMap.date]) continue;

                try {
                    const saleDate = safeParseDate(row[colMap.date]);
                    if (!saleDate || isNaN(saleDate.getTime())) continue;

                    // STRICT YEAR CHECK & CORRECTION
                    // User Instruction: If mismatch, save with SHEET year.
                    const sheetYearMatch = sheetName.match(/^(\d{4})/);
                    if (sheetYearMatch) {
                        const sheetYear = parseInt(sheetYearMatch[1]);
                        const rowYear = saleDate.getFullYear();

                        // CRITICAL: Protect Jan 2026 Manual Data
                        // If we encounter a 2026 date in a non-2026 sheet, we still force it to sheet year?
                        // Yes, if it's in 2024 sheet, user said make it 2024.
                        // BUT if it is actually a Jan 2026 record that drifted here, we technically "corrupt" it to 2024.
                        // User asked specifically for this.

                        // Allow Dec of previous year in Jan sheet logic (Keep this valid)
                        const isDecPrevYear = (sheetName.includes('January') || sheetName.includes('Ocak')) &&
                            rowYear === sheetYear - 1 &&
                            saleDate.getMonth() === 11;

                        if (rowYear !== sheetYear && !isDecPrevYear) {
                            console.log(`CORRECTING Row ${i}: Year Mismatch in ${sheetName}. Changing ${rowYear} -> ${sheetYear}. Raw Date: ${row[colMap.date]}`);
                            saleDate.setFullYear(sheetYear);
                        }
                    }

                    // Column Mapping Check
                    if (colMap.customer === undefined || colMap.item === undefined || colMap.total === undefined) {
                        console.log(`Skipping Row ${i}: Missing critical columns (Customer, Item, Total). Map:`, JSON.stringify(colMap));
                        continue;
                    }

                    const safeVal = (idx) => {
                        if (idx === undefined) return null;
                        const val = row[idx];
                        if (val === undefined || val === null) return null;
                        return val.toString().trim();
                    };

                    const item = safeVal(colMap.item) || 'Unknown Item';
                    const storeName = safeVal(colMap.store) || 'Unknown Store';
                    const customerName = safeVal(colMap.customer);
                    const rawCity = safeVal(colMap.city);
                    const city = normalizeCityName(rawCity);
                    const storeCode = safeVal(colMap.storeCode) || 'UNKNOWN';

                    // Parse numerical values
                    const price = parseFloat(safeVal(colMap.price)?.replace(/[^0-9.,-]/g, '').replace(',', '.') || '0');
                    const quantity = parseInt(safeVal(colMap.quantity)?.replace(/[^0-9-]/g, '') || '1');
                    const total = parseFloat(safeVal(colMap.total)?.replace(/[^0-9.,-]/g, '').replace(',', '.') || '0');
                    const profit = parseFloat(safeVal(colMap.profit)?.replace(/[^0-9.,-]/g, '').replace(',', '.') || '0');

                    // Advanced Extraction for Waybill/Invoice
                    const extractValue = (idx) => {
                        if (idx === undefined) return null;
                        const val = row[idx];
                        if (val === true || val === 'true') {
                            const nextVal = row[idx + 1];
                            if (nextVal && (typeof nextVal === 'string' || typeof nextVal === 'number')) {
                                return nextVal.toString();
                            }
                            return null;
                        }
                        return val ? val.toString() : null;
                    };

                    const waybillNumber = extractValue(colMap.waybill);
                    const invoiceNumber = extractValue(colMap.invoice);

                    const saleData = {
                        date: saleDate,
                        storeCode: storeCode,
                        city: city,
                        region: city,
                        storeName: storeName,
                        salesPerson: 'System Import',
                        customerName: customerName,
                        customerId: undefined,
                        item: item,
                        price: price,
                        quantity: quantity,
                        total: total,
                        profit: profit,
                        isShipped: false,
                        status: 'APPROVED',
                        waybillNumber: waybillNumber,
                        invoiceNumber: invoiceNumber,
                        paymentStatus: 'PENDING'
                    };

                    if (!item || !storeName) continue;

                    let customerId = undefined;
                    if (customerName && customerName !== 'Unknown') {
                        const custKey = customerName.trim().toLowerCase();
                        let existingCustomer = customerCache.get(custKey);

                        if (existingCustomer) {
                            customerId = existingCustomer.id;
                            if (city !== 'Unknown' && storeName !== 'Unknown' && existingCustomer.city !== city) {
                                await prisma.customer.update({
                                    where: { id: existingCustomer.id },
                                    data: {
                                        city: city,
                                    }
                                });
                                // Update cache
                                existingCustomer.city = city;
                                customerCache.set(custKey, existingCustomer);
                            }
                        } else {
                            const newCust = await prisma.customer.create({
                                data: {
                                    name: customerName,
                                    city: city !== 'Unknown' ? city : null,
                                    storeCode: (storeCode && storeCode !== 'Unknown') ? storeCode : null,
                                    contactName: customerName,
                                }
                            });
                            customerId = newCust.id;
                            createdCustomers++;
                            customerCache.set(custKey, newCust);
                        }
                    }

                    if (item && item !== 'Unknown') {
                        const itemKey = item.trim().toLowerCase();
                        let existingProduct = productCache.get(itemKey);

                        if (existingProduct) {
                            if (price > 0 && existingProduct.price != price) { // Only update if price changed
                                await prisma.product.update({
                                    where: { id: existingProduct.id },
                                    data: { price: price }
                                });
                                // Update cache
                                existingProduct.price = price;
                                productCache.set(itemKey, existingProduct);
                            }
                        } else {
                            currentMaxPrdNum++;
                            const pNum = `PRD-${currentMaxPrdNum.toString().padStart(4, '0')}`;
                            const newProduct = await prisma.product.create({
                                data: { name: item, productNumber: pNum, price: price > 0 ? price : 0 }
                            });
                            createdProducts++;
                            productCache.set(itemKey, newProduct);
                        }
                    }

                    const existingSale = await prisma.sale.findFirst({
                        where: {
                            date: saleDate,
                            storeName: saleData.storeName,
                            customerName: saleData.customerName,
                            item: saleData.item,
                            // Strict check to differentiate distinct sales of same item on same day
                            // (If price/qty/total differs, it's a different sale)
                            quantity: saleData.quantity,
                            total: saleData.total
                        }
                    });

                    if (existingSale) {
                        await prisma.sale.update({ where: { id: existingSale.id }, data: saleData });
                    } else {
                        await prisma.sale.create({ data: saleData });
                    }

                    totalCount++;

                    if (totalCount % 50 === 0) console.log(`Processed ${totalCount} records... (Last: ${saleDate.toISOString()})`);

                } catch (e) {
                    console.error('Row Error:', e);
                }
            }
        }

        console.log(`Success! Total imported: ${totalCount}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

importChecklistData();
