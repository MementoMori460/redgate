
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Starting backup...');

        // Fetch all data
        console.log('Fetching Stores...');
        const stores = await prisma.store.findMany();

        console.log('Fetching Customers...');
        const customers = await prisma.customer.findMany();

        console.log('Fetching Products...');
        const products = await prisma.product.findMany();

        console.log('Fetching Sales (this may take a moment)...');
        const sales = await prisma.sale.findMany();

        console.log('Fetching Monthly Targets...');
        const monthlyTargets = await prisma.monthlyTarget.findMany();

        const backupData = {
            timestamp: new Date().toISOString(),
            counts: {
                stores: stores.length,
                customers: customers.length,
                products: products.length,
                sales: sales.length,
                monthlyTargets: monthlyTargets.length
            },
            data: {
                stores,
                customers,
                products,
                sales,
                monthlyTargets
            }
        };

        // Determine desktop path
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const desktopPath = path.join('/Users/ydmacm1/Desktop', `redgate_FULL_backup_${timestamp}.json`);

        console.log(`Writing backup to ${desktopPath}...`);
        fs.writeFileSync(desktopPath, JSON.stringify(backupData, null, 2));

        console.log('Backup completed successfully!');
        console.log(`Saved to: ${desktopPath}`);
        console.log('Summary:', backupData.counts);

    } catch (e) {
        console.error('Backup failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
