import { prisma } from "../../src/lib/prisma.js";
import { createToken } from "../../src/utils/access-token.js";
import type { RoleName } from "../../src/generated/prisma/enums.js";

export interface TestUser {
    id: string
    email: string
    role: RoleName
    token: string
    sessionId: string
}

export async function createTestUser(
    email: string,
    roleName: RoleName = "APPLICANT"
): Promise<TestUser> {
    const role = await prisma.role.findUniqueOrThrow({
        where: { name: roleName },
        include: { permissions: { include: { permission: true } } }
    })

    const permissions = role.permissions.map((rp) => rp.permission.action)

    const user = await prisma.user.create({
        data: {
            name: `Test ${roleName}`,
            email,
            passwordHash: "hashedpassword",
            roleId: role.id
        }
    })

    const session = await prisma.authSession.create({
        data: {
            userId: user.id,
            currentRefreshDigest: "test-digest",
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
            userAgent: "vitest"
        }
    })

    const token = createToken({
        userId: user.id,
        sessionId: session.id,
        role: role.name,
        permissions,
        email: user.email
    })

    return {
        id: user.id,
        email: user.email,
        role: role.name,
        token,
        sessionId: session.id
    }
}