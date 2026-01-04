const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const salesData = [
    {
        date: '2025-12-28',
        storeCode: 'T504',
        city: 'İzmir',
        storeName: 'Gaziemir',
        customerName: 'Çağdaş Özcan',
        item: 'Görsel Baskı İşleri',
        quantity: 1,
        price: 122500.00,
        total: 122500.00,
        status: 'APPROVED',
        isShipped: false
    },
    {
        date: '2026-01-02',
        storeCode: 'T024',
        city: 'Ankara',
        storeName: 'Antares',
        customerName: 'Muzaffer Türker',
        item: 'Peronel Servisi',
        quantity: 1,
        price: 0,
        total: 0,
        status: 'APPROVED',
        isShipped: false
    },
    {
        date: '2026-01-02',
        storeCode: 'T014',
        city: 'Ankara',
        storeName: 'Kentpark',
        customerName: 'Sedat Demir',
        item: 'Balonlu Naylon 150x100 6kg',
        quantity: 10,
        price: 795.00,
        total: 7950.00,
        status: 'APPROVED',
        isShipped: false
    },
    {
        date: '2026-01-02',
        storeCode: 'T014',
        city: 'Ankara',
        storeName: 'Kentpark',
        customerName: 'Sedat Demir',
        item: 'Strech Film 50cm 17 Micron',
        quantity: 12,
        price: 300.00,
        total: 3600.00,
        status: 'APPROVED',
        isShipped: false
    },
    {
        date: '2026-01-02',
        storeCode: 'T014',
        city: 'Ankara',
        storeName: 'Kentpark',
        customerName: 'Sedat Demir',
        item: 'Logolu koli Bantı',
        quantity: 168,
        price: 45.00,
        total: 7560.00,
        status: 'APPROVED',
        isShipped: false
    },
    {
        date: '2026-01-02',
        storeCode: 'T006',
        city: 'Ankara',
        storeName: 'Forum',
        customerName: 'Ayhan Dağ',
        item: 'Peronel Servisi',
        quantity: 1,
        price: 24750.00,
        total: 24750.00,
        status: 'APPROVED',
        isShipped: false
    },
    {
        date: '2026-01-03',
        storeCode: 'T009',
        city: 'Adana',
        storeName: 'M1',
        customerName: 'Figen Toylular',
        item: 'Kağıt Alarm Etiketi 4x4 Barkodlu',
        quantity: 10,
        price: 795.00,
        total: 7950.00,
        status: 'APPROVED',
        isShipped: false,
        orderNumber: '30120261319' // Mapped to description or strictly ignored? Let's put in description if no field
    },
    {
        date: '2026-01-03',
        storeCode: 'T080',
        city: 'Ankara',
        storeName: 'Atlantis',
        customerName: 'Murat İlgün',
        item: 'Patago Tutucu',
        quantity: 2,
        price: 2200.00,
        total: 4400.00,
        status: 'APPROVED',
        isShipped: false,
        orderNumber: '30120261555'
    },
    {
        date: '2026-01-03',
        storeCode: 'T014',
        city: 'Ankara',
        storeName: 'Kentpark',
        customerName: 'Sedat Demir',
        item: 'Oyuncu Koltuğu',
        quantity: 1, // Assumed 1 as price and total are weirdly 0 but unit is 9950? Or total 0? User said "₺9.950,00 ₺0,00". Let's assume Unit 9950, Total 0 (Maybe gift/promo?)
        price: 9950.00,
        total: 0.00,
        status: 'APPROVED',
        isShipped: false
    }
];

async function main() {
    console.log('Inserting/Updating sales data...');

    for (const data of salesData) {
        // Create or Update based on strict matching?
        // Since manually inserting, let's just create if not exists or update.
        // Unique constraint might refer to ID.
        // We will try to find a similar sale on that date/store/item to avoid duplicates if import partly worked.

        const saleDate = new Date(data.date);
        saleDate.setUTCHours(12, 0, 0, 0);

        const existing = await prisma.sale.findFirst({
            where: {
                date: saleDate,
                storeCode: data.storeCode,
                item: data.item,
                customerName: data.customerName
            }
        });

        const salePayload = {
            date: saleDate,
            storeCode: data.storeCode,
            city: data.city,
            region: data.city, // Default region to city
            storeName: data.storeName,
            salesPerson: 'Manual Entry',
            customerName: data.customerName,
            item: data.item,
            quantity: data.quantity,
            price: data.price,
            total: data.total,
            profit: data.total * 0.1, // Dummy profit 10%
            status: data.status,
            isShipped: data.isShipped,
            paymentStatus: 'PENDING'
        };

        if (existing) {
            console.log(`Updating existing sale: ${data.item} for ${data.customerName}`);
            await prisma.sale.update({
                where: { id: existing.id },
                data: salePayload
            });
        } else {
            console.log(`Creating new sale: ${data.item} for ${data.customerName}`);
            await prisma.sale.create({
                data: salePayload
            });
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
