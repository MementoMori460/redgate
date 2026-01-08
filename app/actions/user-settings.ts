'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateUserTheme(theme: string) {
    const session = await auth();

    const user = session?.user as any;
    if (!user?.id && !user?.username) {
        return { success: false, error: 'User not authenticated' };
    }

    try {
        // Use username if id not available (next-auth strategy dependent)
        const whereInput = user.id
            ? { id: user.id }
            : { username: user.username }; // Fallback

        await prisma.user.update({
            where: whereInput,
            data: { theme }
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to update theme:', error);
        return { success: false, error: 'Failed to update theme' };
    }
}
