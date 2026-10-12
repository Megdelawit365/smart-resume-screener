import { prisma } from "../../src/lib/prisma.js";
import { createTestUser, type TestUser } from "./auth.js";

export async function seedRolesAndPermissions() {
    const roles = ["APPLICANT", "RECRUITER", "ADMIN"] as const

    const permissionsList = [
        "jobs:create",
        "jobs:read",
        "jobs:update",
        "jobs:delete",
        "application:create",
        "application:read",
        "application:update",
        "application:delete",
        "application:shortlist",
        "ai:read",
    ]

    const createdRoles: Record<string, { id: string; name: string }> = {}

    for (const name of roles) {
        const role = await prisma.role.upsert({
            where: { name },
            update: {},
            create: { name },
        })
        createdRoles[name] = role
    }

    const createdPermissions: Record<string, { id: string; action: string }> = {}

    for (const action of permissionsList) {
        const perm = await prisma.permission.upsert({
            where: { action },
            update: {},
            create: { action },
        })
        createdPermissions[action] = perm
    }

    const rolePermMap: Record<string, string[]> = {
        APPLICANT: [
            "jobs:read",
            "application:create",
            "application:read",
            "application:update",
            "application:delete",
            "ai:read",
        ],
        RECRUITER: [
            "jobs:create",
            "jobs:read",
            "jobs:update",
            "jobs:delete",
            "application:read",
            "application:update",
            "application:shortlist",
            "ai:read",
        ],
        ADMIN: permissionsList,
    }

    for (const [roleName, actions] of Object.entries(rolePermMap)) {
        for (const action of actions) {
            const roleId = createdRoles[roleName]!.id
            const permissionId = createdPermissions[action]!.id
            await prisma.rolePermission.upsert({
                where: {
                    roleId_permissionId: { roleId, permissionId },
                },
                update: {},
                create: { roleId, permissionId },
            })
        }
    }

    return { roles: createdRoles, permissions: createdPermissions }
}