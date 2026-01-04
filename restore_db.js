const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BACKUP_PATH = '/Users/ydmacm1/Desktop/redgate_backup_20260104.json';

async function restore() {
    if (!fs.existsSync(BACKUP_PATH)) {
        console.error(`Backup file not found at: ${BACKUP_PATH}`);
        console.log("Please move the file to the project root and rename it to 'backup.json' or update the path.");
        process.exit(1);
    }

    console.log(`Reading backup from ${BACKUP_PATH}...`);
    const backup = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf8'));
    const data = backup.data; // Access the nested data object

    console.log('Restoring Stores...');
    if (data.stores) {
        for (const store of data.stores) {
            await prisma.store.upsert({
                where: { code: store.code },
                update: {},
                create: {
                    ...store,
                    createdAt: new Date(store.createdAt),
                    updatedAt: new Date(store.updatedAt)
                }
            });
        }
    }

    console.log('Restoring Customers...');
    if (data.customers) {
        for (const customer of data.customers) {
            await prisma.customer.upsert({
                where: { id: customer.id },
                update: {},
                create: {
                    ...customer,
                    createdAt: new Date(customer.createdAt),
                    updatedAt: new Date(customer.updatedAt)
                }
            });
        }
    }

    console.log('Restoring Products...');
    if (data.products) {
        for (const product of data.products) {
            await prisma.product.upsert({
                where: { productNumber: product.productNumber },
                update: {},
                create: {
                    ...product,
                    createdAt: new Date(product.createdAt),
                    updatedAt: new Date(product.updatedAt)
                }
            });
        }
    }

    console.log('Restoring Sales...');
    if (data.sales) {
        const sales = data.sales.map(sale => ({
            ...sale,
            date: new Date(sale.date),
            createdAt: new Date(sale.createdAt),
            updatedAt: new Date(sale.updatedAt),
            customerId: sale.customerId // Maintain relationship
        }));

        // Batch insert sales for speed
        await prisma.sale.createMany({
            data: sales,
            skipDuplicates: true
        });
    }

    console.log('Restoration Complete!');
}

restore()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
