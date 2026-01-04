const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.sale.count();
    const sales2024 = await prisma.sale.count({
        where: {
            date: {
                gte: new Date('2024-01-01'),
                lt: new Date('2025-01-01'),
            },
        },
    });
    const sales2025 = await prisma.sale.count({
        where: {
            date: {
                gte: new Date('2025-01-01'),
                lt: new Date('2026-01-01'),
            },
        },
    });
    console.log(`Total Sales: ${count}`);
    console.log(`Sales 2024: ${sales2024}`);
    console.log(`Sales 2025: ${sales2025}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
