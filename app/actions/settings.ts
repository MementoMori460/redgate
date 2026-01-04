'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { hash } from "bcryptjs";

export async function getSetting(key: string) {
    try {
        const setting = await prisma.globalSettings.findUnique({
            where: { key }
        });
        return setting?.value;
    } catch (error) {
        console.error(`Failed to get setting ${key}:`, error);
        return null;
    }
}

export async function saveSetting(key: string, value: string) {
    try {
        const session = await auth();
        const role = session?.user?.role;

        if (key === 'TARGET_REVENUE' && role !== 'admin') {
            return { success: false, error: 'Bu ayarı değiştirmek için yetkiniz yok.' };
        }

        await prisma.globalSettings.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error) {
        console.error(`Failed to save setting ${key}:`, error);
        return { success: false, error: 'Failed to save setting' };
    }
}

export async function updateSetting(key: string, value: string) {
    return saveSetting(key, value);
}

export async function updatePassword(password: string) {
    try {
        const session = await auth();
        if (!session?.user?.name) throw new Error("Not authenticated");

        const hashedPassword = await hash(password, 10);
        await prisma.user.update({
            where: { username: session.user.name },
            data: { password: hashedPassword }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to update password:", error);
        throw new Error("Failed to update password");
    }
}
