const XLSX = require("xlsx");
const path = require("path");
const workbook = XLSX.readFile(path.join(process.cwd(), "checklist.xlsx"));

const targets = [
    { date: "2026", item: "Kağıt Alarm" }, // From DB result
    { date: "2026", item: "Wieland" }, // From user previous prompt
    { date: "2026", item: "Veli Fenni" }
];

console.log("Scanning for:", targets);

workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    rows.forEach((row, i) => {
        const str = JSON.stringify(row).toLowerCase();
        if (str.includes("2026") || str.includes("alarm") || str.includes("wieland")) {
            // Check specific matches
            const rowDate = row.find(c => c && c.toString().includes("2026"));
            if(rowDate) {
                 console.log(`MATCH found in ${sheetName} Row ${i+1}:`, row);
            }
        }
    });
});
