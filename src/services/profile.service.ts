import { prisma } from '../lib/prisma.js'
import type { updateProfileBody } from '../schemas/profile.schema.js'

export const getMe = async (userId: string) => {
    return await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, createdAt: true }
    })
}
export const updateProfile = async (userId: string, data: updateProfileBody) => {
    return await prisma.user.update({
        where: { id: userId },
        data: data
    })
}