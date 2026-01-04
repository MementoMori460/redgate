const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const futureDate = new Date('2026-03-01'); // Allow up to Feb 2026 (current time approx)
    console.log('Deleting sales after:', futureDate);

    const result = await prisma.sale.deleteMany({
        where: {
            date: {
                gt: futureDate
            }
        }
    });

    console.log(`Deleted ${result.count} future sales records.`);

    // Also delete "Ocak 2026" entries with 0 price if they are garbage targets
    // User complaint: "Ocak 2026 0 ₺"
    const zeroPriceResult = await prisma.sale.deleteMany({
        where: {
            date: {
                gte: new Date('2026-01-01'),
                lt: new Date('2026-02-01')
            },
            total: 0
        }
    });
    console.log(`Deleted ${zeroPriceResult.count} zero-total sales in Jan 2026.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
