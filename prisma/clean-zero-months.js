const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteBadMonths() {
    try {
        console.log('Deleting records with month=0...');
        const result = await prisma.monthlyTarget.deleteMany({
            where: {
                month: 0
            }
        });
        console.log('Deleted count:', result.count);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteBadMonths();
