const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Deleting invalid sales...');
    const result = await prisma.sale.deleteMany({
        where: {
            OR: [
                { storeName: 'Unknown' },
                { city: 'Unknown' },
                { item: 'Unknown' },
                // Also clean up if item is "Gönderildi" (which implies mapping error)
                { item: 'Gönderildi' },
                { item: 'GÖNDERİLDİ' }
            ]
        }
    });
    console.log(`Deleted ${result.count} invalid sales records.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
