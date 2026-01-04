const { PrismaClient } = require("@prisma/client"); const prisma = new PrismaClient(); async function main() { 
const salesFeb = await prisma.sale.findMany({ where: { date: { gte: new Date("2026-02-01"), lte: new Date("2026-02-28") } } });
const salesAug = await prisma.sale.findMany({ where: { date: { gte: new Date("2026-08-01"), lte: new Date("2026-08-31") } } });
console.log("FEB 2026:", JSON.stringify(salesFeb, null, 2));
console.log("AUG 2026:", JSON.stringify(salesAug, null, 2));
} main().catch(console.error).finally(() => prisma.$disconnect());
