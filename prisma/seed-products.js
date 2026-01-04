const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const products = [
    { name: 'Kırmızı Valiz (Küçük)', productNumber: 'PRD-0001', price: 850.00, cost: 450.00, description: 'Kabin boy dayanıklı valiz.' },
    { name: 'Kırmızı Valiz (Orta)', productNumber: 'PRD-0002', price: 1250.00, cost: 650.00, description: 'Orta boy seyahat valizi.' },
    { name: 'Kırmızı Valiz (Büyük)', productNumber: 'PRD-0003', price: 1500.00, cost: 800.00, description: 'Büyük boy geniş hacimli valiz.' },
    { name: 'Siyah Sırt Çantası', productNumber: 'PRD-0004', price: 450.00, cost: 200.00, description: 'Laptop bölmeli okul çantası.' },
    { name: 'Deri Cüzdan', productNumber: 'PRD-0005', price: 350.00, cost: 120.00, description: 'Hakiki deri erkek cüzdanı.' },
];

async function main() {
    console.log('Seeding products...');
    for (const product of products) {
        await prisma.product.upsert({
            where: { name: product.name },
            update: {},
            create: product,
        });
    }
    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
