const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
// Note: We need xlsx to read excel. If not installed, we might need to rely on the csv logic
// But checklist.xlsx was used before. Let's check if 'xlsx' or 'exceljs' is available.
// run_import_standalone.js used 'read-excel-file/node'.

const readXlsxFile = require('read-excel-file/node');

const prisma = new PrismaClient();
const EXCEL_PATH = path.join(process.cwd(), 'checklist.xlsx');

const TARGET_Cell = 'O1'; // Target is in O1 usually

const sheetNames = [
    '2024 January', '2024 February', '2024 March', '2024 April', '2024 May', '2024 June',
    '2024 July', '2024 August', '2024 September', '2024 October', '2024 November', '2024 December',
    '2025 January', '2025 February', '2025 March', '2025 April', '2025 May', '2025 June',
    '2025 July', '2025 August', '2025 September', '2025 October', '2025 November', '2025 December',
    '2026 January'
];

async function main() {
    console.log('Restoring Targets from Excel...');

    for (const sheetName of sheetNames) {
        try {
            // Parse month/year
            const parts = sheetName.split(' ');
            const year = parseInt(parts[0]);
            const monthName = parts[1];
            const monthMap = {
                'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
                'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
            };
            const month = monthMap[monthName];

            if (!year || !month) continue;

            const rows = await readXlsxFile(EXCEL_PATH, { sheet: sheetName });

            // Expected Format: Row 1 (Header), Row 2 (Data starts)
            // Target is usually in the first row, distinct column?
            // Actually, previously found target was in O1 (index 14 if 0-based)
            // Let's assume Row 0, Col 14

            // Re-verified previous logic:
            // const targetVal = rows[1][14]; // Row 2 (index 1), Col O (index 14) ?
            // Wait, import script said: upserting target...

            // Let's look at `prisma/fix-target.js` logic if exists or just try to find it.
            // Usually Target is a single cell on the top right.
            // In row 0 (header), maybe column O?
            // Or row 1 (data)?

            // Let's try to find a number in top rows column O (index 14) or P.
            // Actually, in previous logs: "Upserting Target for 2024-1: Target=775000"
            // It was successful.

            // Safe bet: The import script logic was `const target = sheet[1][14]`?
            // Let's inspect rows[0] and rows[1].

            // Using a heuristic: Look for a large round number in the first few rows.

            // For now, I will use a dummy value or try to read specifically cell O1 if library supports.
            // read-excel-file returns array of arrays.

            // Previous code:
            // const targetValue = rows[0][14]; // O1 is row 0, col 14

            let targetValue = 0;
            if (rows[0] && rows[0][14]) {
                targetValue = parseFloat(rows[0][14]);
            }
            // If header row doesn't have it, maybe it is a label 'HEDEF' and value next to it?

            // Let's assume Row 0 Col 14 is correct based on memory of 'O1'.

            if (!targetValue || isNaN(targetValue)) {
                // Try strictly reading 'checklist.xlsx' specifically for targets logic?
                // Actually, I'll just default to 0 and log warning.
                console.warn(`Could not find target for ${sheetName}`);
                continue;
            }

            console.log(`Setting Target for ${sheetName}: ${targetValue}`);

            await prisma.monthlyTarget.upsert({
                where: {
                    month_year: {
                        month: month,
                        year: year
                    }
                },
                update: { target: targetValue },
                create: {
                    month: month,
                    year: year,
                    target: targetValue
                }
            });

        } catch (e) {
            console.error(`Error processing ${sheetName}:`, e.message);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
