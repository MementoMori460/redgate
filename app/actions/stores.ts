'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type StoreDTO = {
    id?: string
    code: string
    name: string
    city: string
    region: string
}

export async function getStores() {
    try {
        const stores = await prisma.store.findMany({
            orderBy: { code: 'asc' }
        })
        return stores
    } catch (error) {
        console.error("Failed to fetch stores:", error)
        return []
    }
}

export async function createStore(data: StoreDTO) {
    try {
        const store = await prisma.store.create({
            data: {
                code: data.code,
                name: data.name,
                city: data.city,
                region: data.region
            }
        })
        revalidatePath('/admin/stores')
        return { success: true, data: store }
    } catch (error) {
        console.error("Failed to create store:", error)
        return { success: false, error: "Failed to create store" }
    }
}

export async function updateStore(id: string, data: Partial<StoreDTO>) {
    try {
        const store = await prisma.store.update({
            where: { id },
            data
        })
        revalidatePath('/admin/stores')
        return { success: true, data: store }
    } catch (error) {
        console.error("Failed to update store:", error)
        return { success: false, error: "Failed to update store" }
    }
}

export async function deleteStore(id: string) {
    try {
        await prisma.store.delete({
            where: { id }
        })
        revalidatePath('/admin/stores')
        return { success: true }
    } catch (error) {
        console.error("Failed to delete store:", error)
        return { success: false, error: "Failed to delete store" }
    }
}
