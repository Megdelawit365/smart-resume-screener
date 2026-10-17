import { prisma } from "../src/lib/prisma.js"

async function main() {
    const applicantRole = await prisma.role.upsert({
        where: { name: "APPLICANT" },
        update: {},
        create: { name: "APPLICANT" }
    })

    const recruiterRole = await prisma.role.upsert({
        where: { name: "RECRUITER" },
        update: {},
        create: { name: "RECRUITER" }
    })

    const adminRole = await prisma.role.upsert({
        where: { name: "ADMIN" },
        update: {},
        create: { name: "ADMIN" }
    })

    const permissions = [
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
        "admin:users",
        "admin:jobs"
    ]

    const rolePermMap: Record<string, string[]> = {
        APPLICANT: [
            "jobs:read",
            "application:create",
            "application:read",
            "application:update",
            "application:delete"
        ],
        RECRUITER: [
            "jobs:create",
            "jobs:read",
            "jobs:update",
            "jobs:delete",
            "application:read",
            "application:update",
            "application:shortlist",
            "ai:read"
        ],
        ADMIN: permissions
    }

    const createdPermissions: Record<string, { id: string }> = {}

    for (const action of permissions) {
        const permission = await prisma.permission.upsert({
            where: { action },
            update: {},
            create: { action }
        })
        createdPermissions[action] = permission
    }

    const rolesByName: Record<string, { id: string }> = {
        APPLICANT: applicantRole,
        RECRUITER: recruiterRole,
        ADMIN: adminRole
    }

    for (const roleName in rolePermMap) {
        const roleId = rolesByName[roleName]!.id
        for (const action of rolePermMap[roleName]!) {
            const permissionId = createdPermissions[action]!.id
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId, permissionId } },
                update: {},
                create: { roleId, permissionId }
            })
        }
    }

    console.log("Roles and permissions seeded successfully.")
}

main()
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })