'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';

export async function updatePassword(newPassword: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Not authenticated');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: session.user.id },
        data: { password: hashedPassword },
    });

    return { success: true };
}
// Global Settings Actions
export async function getSetting(key: string) {
    try {
        const setting = await prisma.globalSettings.findUnique({
            where: { key }
        });
        return setting?.value || null;
    } catch (error) {
        console.error("Failed to get setting:", error);
        return null;
    }
}

export async function updateSetting(key: string, value: string) {
    const session = await auth();
    // Only Admin can update settings
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    try {
        await prisma.globalSettings.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to update setting:", error);
        return { success: false, error: "Failed to update setting" };
    }
}
