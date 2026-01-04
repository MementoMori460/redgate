const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(process.cwd(), 'checklist.xlsx');
const workbook = XLSX.readFile(filePath);

const sheetName = workbook.SheetNames.find(n => n.includes('2024') || n.includes('2025'));
console.log('Inspecting sheet:', sheetName);

const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('--- First 10 Rows ---');
rows.slice(0, 10).forEach((row, i) => {
    console.log(`Row ${i}:`, JSON.stringify(row));
});
