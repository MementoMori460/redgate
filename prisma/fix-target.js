const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTargets() {
    try {
        console.log('Fixing Targets...');

        // Fix Dec 2024
        console.log('Upserting Dec 2024...');
        await prisma.monthlyTarget.upsert({
            where: {
                month_year: {
                    month: 12,
                    year: 2024
                }
            },
            update: {
                target: 800000
            },
            create: {
                month: 12,
                year: 2024,
                target: 800000,
                success: 0
            }
        });

        // Ensure Jan 2025 is also correct
        console.log('Upserting Jan 2025...');
        await prisma.monthlyTarget.upsert({
            where: {
                month_year: {
                    month: 1,
                    year: 2025
                }
            },
            update: {
                target: 800000
            },
            create: {
                month: 1,
                year: 2025,
                target: 800000,
                success: 0
            }
        });

        console.log('Done!');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixTargets();
