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

export async function createUser(data: { name: string, username: string, role: string, password?: string, email?: string }) {
    try {
        const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;
        // If no password provided for new user, maybe default or error? 
        // For new user password is usually required. 
        // Let's assume passed password is required for create.
        if (!data.password) throw new Error("Password required");

        await prisma.user.create({
            data: {
                name: data.name,
                username: data.username,
                role: data.role,
                password: await bcrypt.hash(data.password, 10),
                email: data.email,
            }
        });

        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error("Failed to create user:", error);
        return { success: false, error: "Kullanıcı oluşturulamadı." };
    }
}

export async function updateUser(id: string, data: { name: string, username: string, role: string, email?: string }) {
    try {
        await prisma.user.update({
            where: { id },
            data: {
                name: data.name,
                username: data.username,
                role: data.role,
                email: data.email
            }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error("Failed to update user:", error);
        return { success: false, error: "Kullanıcı güncellenemedi." };
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
// ... existing imports

export async function updatePassword(id: string, newPassword: string) {
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword }
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error("Failed to update password:", error);
        return { success: false, error: "Şifre güncellenemedi." };
    }
}
