'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export type MonthlyTargetDTO = {
    id: string;
    month: number;
    year: number;
    target: number;
    success: number | null;
};

export async function getMonthlyTargets(year?: number) {
    const targetYear = year || new Date().getFullYear();

    const targets = await prisma.monthlyTarget.findMany({
        where: {
            year: targetYear
        },
        orderBy: {
            month: 'asc'
        }
    });

    return targets.map(t => ({
        ...t,
        target: Number(t.target),
        success: t.success ? Number(t.success) : null
    }));
}

export async function upsertMonthlyTarget(data: { month: number, year: number, target: number }) {
    try {
        await prisma.monthlyTarget.upsert({
            where: {
                month_year: {
                    month: data.month,
                    year: data.year
                }
            },
            update: {
                target: data.target
            },
            create: {
                month: data.month,
                year: data.year,
                target: data.target
            }
        });

        revalidatePath('/admin/targets');
        revalidatePath('/sales'); // Update dashboard as well
        return { success: true };
    } catch (error) {
        console.error('Failed to upsert target:', error);
        return { success: false, error: 'Target güncellenemedi.' };
    }
}
