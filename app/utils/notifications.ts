'use server';

import { prisma } from "@/lib/prisma";
import nodemailer from 'nodemailer';
import { getSetting } from '../actions/settings';

// Email Configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASS || 'password',
    },
});

export async function checkLateShipments() {
    try {
        const daysSetting = await getSetting('MAX_SHIPPING_DAYS') || '3';
        const days = parseInt(daysSetting);

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const lateSales = await prisma.sale.count({
            where: {
                isShipped: false,
                createdAt: {
                    lt: cutoffDate
                },
                status: 'APPROVED' // Only count approved orders
            }
        });

        return lateSales;
    } catch (error) {
        console.error("Failed to check late shipments:", error);
        return 0;
    }
}

export async function sendShippingEmail(saleId: string) {
    try {
        const sale = await prisma.sale.findUnique({
            where: { id: saleId },
            include: { customer: true }
        });

        if (!sale || !sale.customer || !sale.customer.email) {
            console.log(`Skipping email: Customer email not found for sale ${saleId}`);
            return { success: false, reason: 'No customer email' };
        }

        const mailOptions = {
            from: '"RedGate Sales" <noreply@redgate.com>',
            to: sale.customer.email,
            subject: `Siparişiniz Kargolandı! - ${sale.item}`,
            text: `Sayın ${sale.customer.name},\n\n${sale.storeName} mağazası için verdiğiniz ${sale.item} (${sale.quantity} Adet) siparişiniz kargoya verilmiştir.\n\nİyi çalışmalar,\nRedGate Ekibi`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #3b82f6;">Siparişiniz Yola Çıktı! 🚚</h2>
                    <p>Sayın <strong>${sale.customer.name}</strong>,</p>
                    <p>${sale.storeName} mağazası için verdiğiniz siparişiniz kargoya verilmiştir.</p>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Ürün:</strong> ${sale.item}</p>
                        <p><strong>Adet:</strong> ${sale.quantity}</p>
                    </div>
                    <p>İyi çalışmalar,<br>RedGate Ekibi</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${sale.customer.email}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to send shipping email:", error);
        return { success: false, error };
    }
}
