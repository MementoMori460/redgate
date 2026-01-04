const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

async function debugSheet() {
    const filePath = path.join(process.cwd(), 'checklist.xlsx');
    const buf = fs.readFileSync(filePath);
    const wb = XLSX.read(buf, { type: 'buffer' });

    // Find the sheet
    const sheetName = wb.SheetNames.find(n => n.includes('2025') && (n.includes('December') || n.includes('Aralık')));

    if (!sheetName) {
        console.log("Could not find 2025 December sheet.");
        return;
    }

    console.log(`Debugging Sheet: ${sheetName}`);
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    // Print first 10 rows to see structure
    console.log("--- First 10 Rows (Raw) ---");
    rows.slice(0, 10).forEach((row, i) => {
        console.log(`Row ${i}:`, JSON.stringify(row));
    });

    // Run the same detection logic as the main script
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
            console.log(`\nHeader detected at Row ${i}`);

            rowStrs.forEach((colName, idx) => {
                if (colName === 'date' || colName === 'tarih') colMap.date = idx;
                else if (colName === 'city' || colName === 'şehir' || colName === 'sehir') colMap.city = idx;
                else if (colName === 'store' || colName === 'mağaza' || colName === 'magaza') colMap.store = idx;
                else if (colName === 'item' || colName === 'ürün' || colName === 'urun' || colName === 'açıklama' || colName === 'description' || colName === 'product') colMap.item = idx;
                else if (colName === 'quantity' || colName === 'adet' || colName === 'miktar') colMap.quantity = idx;
                else if (colName === 'price' || colName === 'birim fiyat' || colName === 'fiyat') colMap.price = idx;
                else if (colName === 'total' || colName === 'toplam' || colName === 'tutar') colMap.total = idx;
            });
            break;
        }
    }

    console.log("\n--- Column Mapping ---");
    console.log(colMap);
}

debugSheet();
