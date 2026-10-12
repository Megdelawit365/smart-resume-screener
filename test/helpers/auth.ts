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
    roleName: RoleName = "APPLICANT",
    permissions: string[] = [],
): Promise<TestUser> {
    let role = await prisma.role.findUnique({ where: { name: roleName } })
    if (!role) {
        role = await prisma.role.create({ data: { name: roleName } })
    }

    for (const action of permissions) {
        let perm = await prisma.permission.findUnique({ where: { action } })
        if (!perm) {
            perm = await prisma.permission.create({ data: { action } })
        }

        const existing = await prisma.rolePermission.findFirst({
            where: { roleId: role.id, permissionId: perm.id },
        })

        if (!existing) {
            await prisma.rolePermission.create({
                data: { roleId: role.id, permissionId: perm.id },
            })
        }
    }

    const user = await prisma.user.create({
        data: {
            name: `Test ${roleName}`,
            email,
            passwordHash: "hashedpassword",
            roleId: role.id,
        },
    })

    const session = await prisma.authSession.create({
        data: {
            userId: user.id,
            currentRefreshDigest: "test-digest",
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
            userAgent: "vitest",
        },
    })

    const token = createToken({
        userId: user.id,
        sessionId: session.id,
        role: role.name,
    })

    return {
        id: user.id,
        email: user.email,
        role: role.name,
        token,
        sessionId: session.id,
    }
}