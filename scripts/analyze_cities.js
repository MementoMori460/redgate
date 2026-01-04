const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeCities() {
    const sales = await prisma.sale.groupBy({
        by: ['city'],
        _count: {
            city: true
        }
    });

    console.log('--- City Counts ---');
    sales.sort((a, b) => b._count.city - a._count.city);
    sales.forEach(s => {
        console.log(`${s.city}: ${s._count.city}`);
    });
}

analyzeCities()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
