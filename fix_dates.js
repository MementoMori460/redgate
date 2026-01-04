const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fixing date errors...');

    // Find records with year 0204
    const sales = await prisma.sale.findMany({
        where: {
            date: {
                lt: new Date('2000-01-01')
            }
        }
    });

    console.log(`Found ${sales.length} sales with old dates.`);

    for (const sale of sales) {
        const oldDate = new Date(sale.date);
        const newYear = oldDate.getFullYear() === 204 ? 2024 : 2024; // Default to 2024 fix
        const newDate = new Date(oldDate);
        newDate.setFullYear(newYear);

        await prisma.sale.update({
            where: { id: sale.id },
            data: { date: newDate }
        });
        console.log(`Updated sale ${sale.id}: ${oldDate.toISOString()} -> ${newDate.toISOString()}`);
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
