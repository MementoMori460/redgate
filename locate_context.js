const XLSX = require('xlsx');
const path = require('path');

const workbook = XLSX.readFile(path.join(process.cwd(), 'checklist.xlsx'));

const targetItem = "Kağıt Alarm Etiketi 4x4 Barkodlu";
const targetStore = "Natavega";

console.log(`Searching for: ${targetStore} - ${targetItem}`);

workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const str = JSON.stringify(row).toLowerCase();

        if (str.includes(targetItem.toLowerCase()) && str.includes(targetStore.toLowerCase())) {
            console.log(`\n!!! FOUND in Sheet: "${sheetName}" at Row ${i + 1} !!!`);

            // Print context
            for (let j = i - 2; j <= i + 2; j++) {
                if (j >= 0 && j < rows.length) {
                    const prefix = j === i ? ">>> " : "    ";
                    console.log(`${prefix}Row ${j + 1}: ${JSON.stringify(rows[j])}`);
                }
            }
        }
    }
});
