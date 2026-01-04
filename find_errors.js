const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'checklist.xlsx');
console.log('Reading file:', filePath);

try {
    if (!fs.existsSync(filePath)) {
        console.error("File does not exist!");
        process.exit(1);
    }
    const stats = fs.statSync(filePath);
    console.log(`File size: ${stats.size} bytes`);

    console.log("Starting XLSX read...");
    const workbook = XLSX.readFile(filePath);
    console.log("Workbook loaded. Sheet names:", workbook.SheetNames);

    const result = [];
    const today = new Date('2026-01-04');

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

        let colMap = {};
        let headerRow = -1;

        // Find header
        for (let i = 0; i < Math.min(rows.length, 20); i++) {
            const row = rows[i];
            if (!row) continue;
            const rowStrs = row.map(r => r ? r.toString().toLowerCase() : '');
            if (rowStrs.some(s => s.includes('date') || s.includes('tarih'))) {
                headerRow = i;
                rowStrs.forEach((h, idx) => {
                    if (h.includes('date') || h.includes('tarih')) colMap.date = idx;
                    if (h.includes('store') || h.includes('mağaza')) colMap.store = idx;
                    if (h.includes('item') || h.includes('ürün') || h.includes('açıklama')) colMap.item = idx;
                });
                break;
            }
        }

        if (headerRow === -1) return;

        for (let i = headerRow + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || typeof row[colMap.date] === 'undefined') continue;

            let val = row[colMap.date];
            let date = null;

            // Simple parse logic
            if (typeof val === 'number') {
                date = new Date(Math.round((val - 25569) * 86400 * 1000));
            } else if (typeof val === 'string') {
                const trimmed = val.trim().replace(/[i\-\/]/g, '.');
                const parts = trimmed.split('.');
                if (parts.length === 3) {
                    // Assume DD.MM.YYYY
                    date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                } else {
                    date = new Date(trimmed);
                }
            }

            if (date && !isNaN(date.getTime())) {
                const y = date.getFullYear();

                // Flag:
                // 1. Years significantly in future or past (typos)
                // 2. Dates in 2026 that are after "today" (Jan 4)

                const isStrangeYear = y > 2026 || y < 2023;
                const isFuture2026 = (y === 2026 && date > today);

                if (isStrangeYear || isFuture2026) {
                    result.push({
                        sheet: sheetName,
                        row: i + 1, // Excel row number (1-based)
                        date: date.toLocaleDateString(),
                        raw: val,
                        store: row[colMap.store] || '?',
                        item: row[colMap.item] || '?'
                    });
                }
            }
        }
    });

    console.log(JSON.stringify(result, null, 2));

} catch (e) {
    console.error(e);
}
