const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting cleanup...');

    // 1. Delete Sales (Transactionally safe to delete children first if any, but Sale is leaf usually)
    const deletedSales = await prisma.sale.deleteMany({});
    console.log(`Deleted ${deletedSales.count} sales.`);

    // 2. Delete Customers
    const deletedCustomers = await prisma.customer.deleteMany({});
    console.log(`Deleted ${deletedCustomers.count} customers.`);

    // 3. Delete Products
    const deletedProducts = await prisma.product.deleteMany({});
    console.log(`Deleted ${deletedProducts.count} products.`);

    console.log('Cleanup complete. USERS and STORES were PRESERVED.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
