const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    console.log('Restoring Users and Stores...');

    if (!fs.existsSync('db_backup_temp.json')) {
        console.error('Backup file not found!');
        process.exit(1);
    }

    const backup = JSON.parse(fs.readFileSync('db_backup_temp.json', 'utf-8'));

    // Restore Users
    if (backup.users && backup.users.length > 0) {
        console.log(`Restoring ${backup.users.length} users...`);
        for (const user of backup.users) {
            await prisma.user.create({ data: user });
        }
    }

    // Restore Stores
    if (backup.stores && backup.stores.length > 0) {
        console.log(`Restoring ${backup.stores.length} stores...`);
        for (const store of backup.stores) {
            await prisma.store.create({ data: store });
        }
    }

    // Restore Settings
    if (backup.settings && backup.settings.length > 0) {
        console.log(`Restoring ${backup.settings.length} settings...`);
        for (const setting of backup.settings) {
            await prisma.globalSettings.create({ data: setting });
        }
    }

    console.log('Restore complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
