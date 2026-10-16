import { prisma } from "../lib/prisma.js"

export const listUsers = async () => {
    return prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            roleId: true,
            createdAt: true
        }
    })
}

export const setUserActive = async (userId: string, isActive: boolean) => {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw { status: 404, message: "User not found" }

    return prisma.user.update({
        where: { id: userId },
        data: { isActive },
        select: { id: true, email: true, isActive: true }
    })
}

export const setUserRole = async (userId: string, roleName: "APPLICANT" | "RECRUITER" | "ADMIN") => {
    const role = await prisma.role.findUnique({ where: { name: roleName } })
    if (!role) throw { status: 404, message: "Role not found" }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw { status: 404, message: "User not found" }

    return prisma.user.update({
        where: { id: userId },
        data: { roleId: role.id },
        select: { id: true, email: true, roleId: true }
    })
}

export const listAllJobs = async () => {
    return prisma.job.findMany({
        include: { recruiter: { select: { email: true } } }
    })
}

export const listAllApplications = async () => {
    return prisma.application.findMany({
        include: {
            applicant: { select: { email: true } },
            job: { select: { title: true } }
        }
    })
}