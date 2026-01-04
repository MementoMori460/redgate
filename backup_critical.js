const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    console.log('Backing up Users and Stores...');

    const users = await prisma.user.findMany();
    const stores = await prisma.store.findMany();
    const settings = await prisma.globalSettings.findMany();

    const backup = { users, stores, settings };

    fs.writeFileSync('db_backup_temp.json', JSON.stringify(backup, null, 2));
    console.log(`Backup saved: ${users.length} users, ${stores.length} stores.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
