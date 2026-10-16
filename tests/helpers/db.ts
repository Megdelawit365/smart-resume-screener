import { prisma } from "../../src/lib/prisma.js";

export async function cleanDatabase() {
    await prisma.aIEvaluation.deleteMany()
    await prisma.application.deleteMany()
    await prisma.job.deleteMany()
    await prisma.authSession.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()
    await prisma.rolePermission.deleteMany()
    await prisma.permission.deleteMany()
    await prisma.role.deleteMany()
}