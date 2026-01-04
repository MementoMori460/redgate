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
    }

    if (typeof val === 'string') {
        const trimmed = val.trim();
        let d = new Date(trimmed);
        if (!isNaN(d.getTime())) {
            d.setUTCHours(12, 0, 0, 0);
            return d;
        }

        const normalized = trimmed.replace(/[i\-\/]/g, '.');
        const dmY = normalized.match(/^(\d{1,2})[.](\d{1,2})[.](\d{4})$/);

        if (dmY) {
            const d = new Date(parseInt(dmY[3]), parseInt(dmY[2]) - 1, parseInt(dmY[1]));
            d.setUTCHours(12, 0, 0, 0);
            return d;
        }
    }
    return null;
}

function normalizeCityName(city) {
    if (!city || typeof city !== 'string') return '';
    return city
        .trim()
        .toLowerCase()
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/\b\w/g, c => c.toUpperCase());
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

        for (const sheetName of validSheets) {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

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
                            if (checkCol(['waybill', 'irsaliye', 'sevk'], idx)) colMap.waybill = idx;
                        }

                        if (colMap.invoice === undefined) {
                            if (checkCol(['invoice', 'fatura'], idx)) colMap.invoice = idx;
                        }
                    });
                    break;
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
            if (colMap.date === undefined) colMap.date = 2;

            for (let i = headerIndex + 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || !row[colMap.date]) continue;

                try {
                    const saleDate = safeParseDate(row[colMap.date]);
                    if (!saleDate || isNaN(saleDate.getTime())) continue;

                    const rawCity = colMap.city !== undefined ? (row[colMap.city]?.toString() || 'Unknown') : 'Unknown';
                    const city = normalizeCityName(rawCity);
                    const storeName = colMap.store !== undefined ? (row[colMap.store]?.toString() || 'Unknown') : 'Unknown';
                    const customerName = colMap.customer !== undefined ? (row[colMap.customer]?.toString() || 'Unknown') : 'Unknown';
                    const item = colMap.item !== undefined ? (row[colMap.item]?.toString() || 'Unknown') : 'Unknown';
                    const quantity = colMap.quantity !== undefined ? (parseInt(row[colMap.quantity]) || 1) : 1;
                    const price = colMap.price !== undefined ? (parseFloat(row[colMap.price]) || 0) : 0;
                    const total = colMap.total !== undefined ? (parseFloat(row[colMap.total]) || 0) : 0;
                    const profit = colMap.profit !== undefined ? (parseFloat(row[colMap.profit]) || 0) : 0;

                    const rawStoreCode = colMap.storeCode !== undefined ? (row[colMap.storeCode]?.toString() || '') : '';
                    let finalStoreCode = rawStoreCode.trim();
                    if (!finalStoreCode || finalStoreCode.length < 2) {
                        finalStoreCode = storeName.toUpperCase().substring(0, 3) + "001";
                    }

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

                    if (!item || !storeName) continue;

                    let customerId = undefined;
                    if (customerName && customerName !== 'Unknown') {
                        const existingCustomer = await prisma.customer.findFirst({ where: { name: customerName } });
                        if (existingCustomer) {
                            customerId = existingCustomer.id;
                            if (city !== 'Unknown' && storeName !== 'Unknown') {
                                await prisma.customer.update({
                                    where: { id: existingCustomer.id },
                                    data: {
                                        city: city,
                                    }
                                });
                            }
                        } else {
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

                    if (item && item !== 'Unknown') {
                        const existingProduct = await prisma.product.findUnique({ where: { name: item } });
                        if (existingProduct) {
                            if (price > 0) {
                                await prisma.product.update({
                                    where: { id: existingProduct.id },
                                    data: { price: price }
                                });
                            }
                        } else {
                            const lastProduct = await prisma.product.findFirst({
                                where: { productNumber: { startsWith: 'PRD-' } },
                                orderBy: { productNumber: 'desc' }
                            });
                            let nextNum = 1;
                            if (lastProduct) {
                                const match = lastProduct.productNumber.match(/PRD-(\d+)/);
                                if (match) nextNum = parseInt(match[1]) + 1;
                            }
                            const pNum = `PRD-${nextNum.toString().padStart(4, '0')}`;
                            await prisma.product.create({
                                data: { name: item, productNumber: pNum, price: price > 0 ? price : 0 }
                            });
                        }
                    }

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
                        isShipped: !!waybillNumber || true,
                        status: 'APPROVED',
                        waybillNumber: waybillNumber,
                        invoiceNumber: invoiceNumber,
                        paymentStatus: 'PAID', // Force PAID
                    };

                    if (existingSale) {
                        await prisma.sale.update({ where: { id: existingSale.id }, data: saleData });
                    } else {
                        await prisma.sale.create({ data: saleData });
                    }

                    totalCount++;
                    if (totalCount % 100 === 0) console.log(`Processed ${totalCount} records...`);

                } catch (e) {
                    // console.error(e);
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
