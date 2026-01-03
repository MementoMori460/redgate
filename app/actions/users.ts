'use server';

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from 'bcryptjs';

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        });
        // Remove passwords from response
        return users.map(u => {
            const { password, ...userWithoutPassword } = u;
            return userWithoutPassword;
        });
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return [];
    }
}

export async function createUser(firstName: string, username: string, role: string, password: string) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                name: firstName,
                username,
                role,
                password: hashedPassword,
            }
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error("Failed to create user:", error);
        return { success: false, error: "Kullanıcı oluşturulamadı." };
    }
}

export async function deleteUser(id: string) {
    try {
        await prisma.user.delete({
            where: { id }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete user:", error);
        return { success: false, error: "Kullanıcı silinemedi." };
    }
}
