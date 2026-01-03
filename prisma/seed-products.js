const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const filePath = path.join(__dirname, '../CHECKLİST 2025 - 2024 January.csv');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    console.log(`Found ${lines.length} lines in CSV.`);

    // Product Name is at index 6 (Column G)
    // Price is at index 10 (Column H - "Piece") ? No, let's look at the header:
    // Date,City,Store,Purchase,,Piece,,, Total
    // 0    1    2     3       4 5     6   7 8      9
    // Wait, let's re-examine a line:
    // ,,02.01.2024,Bursa,Korupark,Sezgin İtem,Kanca 100cm,Adet,20," 85,00 TL "
    // 0 1 2          3     4        5           6           7    8  9

    // Index 6 = Product Name (e.g., "Kanca 100cm")
    // Index 9 = Unit Price (e.g., " 85,00 TL ")

    const uniqueProducts = new Map();

    // Start from line 9 (index 8) based on previous view
    for (let i = 9; i < lines.length; i++) {
        const line = lines[i];
        // CSV parsing is tricky with quoted commas. Simple split might fail if product name has commas.
        // Given the format, product names don't seem to have commas, but let's be careful.
        // The price has commas (" 85,00 TL ").

        // Quick regex to split by comma but ignore commas inside quotes
        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        // Actually simplicity might work if we just split by ',' and handle indices, but Quotes complicate it.

        // Usage of a proper CSV parser library is better but I can't install new deps easily without user permission.
        // Let's try to extract manually.

        const rawParts = line.split(',');
        // Getting messy. Let's look at the specific line structure again.
        // ,,DATE,CITY,STORE,SALESPERSON,ITEM,UNIT,QUANTITY,PRICE,...

        // Index 6 is consistently the Item Name ?
        // Let's assume standard CSV structure where "Quoted fields" are handled.
        // For this specific file, simple split might key off wrong indices due to extra commas in empty fields.

        // Let's retry a robust regex split:
        // This regex splits by comma that is NOT followed by a double quote (imperfect but better)
        // or just use a simple state machine parser.

        const matches = [];
        let current = '';
        let inQuote = false;
        for (let char of line) {
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                matches.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        matches.push(current);

        if (matches.length < 8) continue; // Skip malformed lines

        // Index 6 is the product name
        let productName = matches[6]?.trim();
        if (!productName) continue;

        // Cleanup quotes if present
        productName = productName.replace(/^"|"$/g, '').trim();

        if (productName && !uniqueProducts.has(productName)) {
            // Try to get price from index 9
            let priceStr = matches[9]?.trim().replace(/^"|"$/g, '').trim();
            // "  85,00 TL " -> 85.00
            let price = null;
            if (priceStr) {
                // Remove TL, spaces
                priceStr = priceStr.replace('TL', '').trim().replace(/\./g, '').replace(',', '.');
                const parsed = parseFloat(priceStr);
                if (!isNaN(parsed)) price = parsed;
            }

            uniqueProducts.set(productName, price);
        }
    }

    console.log(`Found ${uniqueProducts.size} unique products.`);

    let counter = 1;
    for (const [name, price] of uniqueProducts) {
        const productNumber = `PRD-${String(counter).padStart(3, '0')}`;

        await prisma.product.upsert({
            where: { name },
            update: { price }, // Update price if exists
            create: {
                productNumber,
                name,
                price
            }
        });
        counter++;
    }

    console.log('Seeding products completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
