const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const LOG_PATH = path.join(process.cwd(), 'import_debug.log');

async function main() {
    console.log(`Reading targets from ${LOG_PATH}...`);

    if (!fs.existsSync(LOG_PATH)) {
        console.error("Log file not found!");
        return;
    }

    const content = fs.readFileSync(LOG_PATH, 'utf-8');
    const lines = content.split('\n');

    const regex = /Upserting Target for (\d{4})-(\d{1,2}): Target=([\d.]+), Success=([\d.]+)/;

    let count = 0;

    for (const line of lines) {
        const match = line.match(regex);
        if (match) {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]);
            const target = parseFloat(match[3]);
            const success = parseFloat(match[4]);

            console.log(`Restoring Target: ${year}-${month} => Target: ${target}, Success: ${success}`);

            await prisma.monthlyTarget.upsert({
                where: {
                    month_year: {
                        month: month,
                        year: year
                    }
                },
                update: {
                    target: target,
                    success: success
                },
                create: {
                    month: month,
                    year: year,
                    target: target,
                    success: success
                }
            });
            count++;
        }
    }

    console.log(`\nRestoration Complete! Restored ${count} targets.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
