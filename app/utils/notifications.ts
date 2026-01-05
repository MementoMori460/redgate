'use server';

import { prisma } from "@/lib/prisma";
import nodemailer from 'nodemailer';
import { getSetting } from '../actions/settings';

// Email Configuration

// Dynamic Transporter Helper
async function getTransporter() {
    const host = await getSetting('SMTP_HOST');
    const port = await getSetting('SMTP_PORT');
    const user = await getSetting('SMTP_USER');
    const pass = await getSetting('SMTP_PASS');

    if (!host || !user || !pass) return null;

    return nodemailer.createTransport({
        host: host,
        port: parseInt(port || '587'),
        secure: false,
        auth: {
            user: user,
            pass: pass,
        },
    });
}


export async function checkLateShipments() {
    try {
        const daysSetting = await getSetting('MAX_SHIPPING_DAYS');
        let days = parseInt(daysSetting || '3');
        if (isNaN(days)) days = 3;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        cutoffDate.setHours(23, 59, 59, 999); // Include the entire cutoff day



        const lateSales = await prisma.sale.count({
            where: {
                isShipped: false,
                date: {
                    lt: cutoffDate
                }
            }
        });

        // Check if we should send a notification (once every 24 hours)
        if (lateSales > 0) {
            const lastSent = await getSetting('LAST_LATE_NOTIFICATION');
            const now = new Date();
            const lastDate = lastSent ? new Date(lastSent) : new Date(0);

            // Check if 24 hours passed
            if (now.getTime() - lastDate.getTime() > 24 * 60 * 60 * 1000) {
                const adminEmail = await getSetting('ADMIN_EMAIL');
                if (adminEmail) {
                    // Fetch the actual sales
                    const sales = await prisma.sale.findMany({
                        where: { isShipped: false, date: { lt: cutoffDate } },
                        select: { item: true, customerName: true, date: true, storeName: true }
                    });

                    if (sales.length > 0) {
                        // Send Email
                        const transporter = await getTransporter();
                        if (transporter && adminEmail) {
                            const summary = sales.map(s => `- ${s.customerName} (${s.storeName}): ${s.item} (${s.date.toLocaleDateString('tr-TR')})`).join('\n');
                            const mailOptions = {
                                from: '"RedGate System" <noreply@redgate.com>',
                                to: adminEmail,
                                subject: `⚠️ Geciken Sipariş Uyarısı (${lateSales} Adet)`,
                                text: `Aşağıdaki siparişlerin kargolanma süresi geçmiştir:\n\n${summary}\n\nLütfen kontrol ediniz.`,
                            };
                            await transporter.sendMail(mailOptions);
                        }

                        // Update setting using prisma directly to avoid circular dependency loop with settings.ts if any
                        await prisma.globalSettings.upsert({
                            where: { key: 'LAST_LATE_NOTIFICATION' },
                            update: { value: now.toISOString() },
                            create: { key: 'LAST_LATE_NOTIFICATION', value: now.toISOString() }
                        });
                        console.log("Late shipment notification sent.");
                    }
                }
            }
        }

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

        if (!sale) return { success: false, error: "Sale not found" };

        if (sale.customer && sale.customer.email) {
            const transporter = await getTransporter();
            if (transporter) {
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
                                <p><strong>Kargo Takip:</strong> ${sale.waybillNumber || 'Belirtilmedi'}</p>
                            </div>
                            <p>İyi çalışmalar,<br>RedGate Ekibi</p>
                        </div>
                    `,
                };
                await transporter.sendMail(mailOptions);
                console.log(`Email sent to Customer: ${sale.customer.email}`);
            } else {
                console.log("Transporter not ready");
            }
        }

        // Notify Admin & Sales Person
        const recipients = [];
        const adminEmail = await getSetting('ADMIN_EMAIL');
        if (adminEmail) recipients.push(adminEmail);

        /*
        if (sale.salesPerson) {
            const spUser = await prisma.user.findFirst({ where: { name: sale.salesPerson } });
            if (spUser && spUser.email && spUser.email !== adminEmail) {
                recipients.push(spUser.email);
            }
        }
        */

        if (recipients.length > 0) {
            const transporter = await getTransporter();
            if (transporter) {
                const internalMailOptions = {
                    from: '"RedGate System" <noreply@redgate.com>',
                    to: recipients.join(', '),
                    subject: `Kargo Gönderildi: ${sale.customerName} - ${sale.item}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h2 style="color: #10b981;">Sipariş Kargolandı ✅</h2>
                            <p>Aşağıdaki siparişin kargo çıkışı yapılmıştır:</p>
                            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>Müşteri:</strong> ${sale.customerName}</p>
                                <p><strong>Mağaza:</strong> ${sale.storeName}</p>
                                <p><strong>Ürün:</strong> ${sale.item}</p>
                                <p><strong>Adet:</strong> ${sale.quantity}</p>
                                <p><strong>İlgili Plasiyer:</strong> ${sale.salesPerson}</p>
                                <p><strong>İrsaliye/Takip No:</strong> ${sale.waybillNumber || '-'}</p>
                            </div>
                        </div>
                    `,
                };
                await transporter.sendMail(internalMailOptions);
                console.log(`Shipment notification sent to: ${recipients.join(', ')}`);
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to send shipping email:", error);
        return { success: false, error };
    }
}

export async function sendNewOrderEmailToAdmins(saleId: string) {
    try {
        const adminEmail = await getSetting('ADMIN_EMAIL');
        if (!adminEmail) {
            console.log("Skipping admin email: ADMIN_EMAIL setting not found.");
            return { success: false, reason: 'No admin email configured' };
        }

        const sale = await prisma.sale.findUnique({
            where: { id: saleId },
            include: { customer: true }
        });

        if (!sale) return { success: false, reason: 'Sale not found' };

        const mailOptions = {
            from: '"RedGate System" <noreply@redgate.com>',
            to: adminEmail,
            subject: `Yeni Sipariş: ${sale.customerName} - ${sale.item}`,
            text: `Yeni bir sipariş alındı.\n\nMüşteri: ${sale.customerName}\nÜrün: ${sale.item}\nAdet: ${sale.quantity}\nTutar: ${sale.total} TL\n\nPanelden onaylayabilirsiniz.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #3b82f6;">Yeni Sipariş Alındı! 🔔</h2>
                    <p><strong>${sale.customerName}</strong> tarafından yeni bir sipariş oluşturuldu.</p>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Ürün:</strong> ${sale.item}</p>
                        <p><strong>Adet:</strong> ${sale.quantity}</p>
                        <p><strong>Bölge/Şehir:</strong> ${sale.region} / ${sale.city}</p>
                        <p><strong>Tutar:</strong> ${sale.total} TL</p>
                        ${sale.description ? `<p><strong>Not:</strong> ${sale.description}</p>` : ''}
                    </div>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Panele Git</a>
                </div>
            `,
        };

        const transporter = await getTransporter();
        if (transporter) {
            await transporter.sendMail(mailOptions);
            console.log(`New order notification sent to ${adminEmail}`);
            return { success: true };
        } else {
            console.log("Transporter not configured");
            return { success: false, reason: "SMTP Settings missing" };
        }
    } catch (error) {
        console.error("Failed to send admin notification:", error);
        return { success: false, error };
    }
}

export async function sendBatchOrderEmailToAdmins(sales: any[]) {
    try {
        const adminEmail = await getSetting('ADMIN_EMAIL');
        if (!adminEmail) return;

        const customerName = sales[0].customerName;
        const totalAmount = sales.reduce((sum: number, s: any) => sum + Number(s.total), 0);

        const itemsHtml = sales.map((s: any) => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${s.item}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${s.quantity}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${Number(s.total).toLocaleString('tr-TR')} TL</td>
            </tr>
        `).join('');

        const mailOptions = {
            from: '"RedGate System" <noreply@redgate.com>',
            to: adminEmail,
            subject: `Yeni Toplu Sipariş: ${customerName}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #3b82f6;">Yeni Sipariş (Sepet)! 🛒</h2>
                    <p><strong>${customerName}</strong> tarafından ${sales.length} kalem ürün sipariş edildi.</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr style="background: #f9fafb; text-align: left;">
                                <th style="padding: 8px;">Ürün</th>
                                <th style="padding: 8px;">Adet</th>
                                <th style="padding: 8px;">Tutar</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="2" style="padding: 8px; font-weight: bold; text-align: right;">Toplam:</td>
                                <td style="padding: 8px; font-weight: bold;">${totalAmount.toLocaleString('tr-TR')} TL</td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/orders" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Siparişleri Yönet</a>
                </div>
            `,
        };

        const transporter = await getTransporter();
        if (transporter) {
            await transporter.sendMail(mailOptions);
        }
    } catch (error) {
        console.error("Batch email error:", error);
    }
}
