import { prisma } from '../src/lib/prisma.js'

async function main() {
    const applicantRole = await prisma.role.upsert({
        where: { name: "APPLICANT" },
        update: {},
        create: { name: "APPLICANT" },
    })

    const recruiterRole = await prisma.role.upsert({
        where: { name: "RECRUITER" },
        update: {},
        create: { name: "RECRUITER" },
    })

    const adminRole = await prisma.role.upsert({
        where: { name: "ADMIN" },
        update: {},
        create: { name: "ADMIN" },
    })

    const permissions = [
        "contract:create",
        "contract:read",
        "contract:update",
        "jobs:create",
        "jobs:update",
        "jobs:delete",
        "application:read",
        "application:update",
        "application:create",
        "application:delete"
    ]

    for (const action of permissions) {
        const permission = await prisma.permission.upsert({
            where: { action },
            update: {},
            create: { action },
        })

        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: applicantRole.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: applicantRole.id,
                permissionId: permission.id,
            },
        })

        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: recruiterRole.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: recruiterRole.id,
                permissionId: permission.id,
            },
        })

        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: adminRole.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: adminRole.id,
                permissionId: permission.id,
            },
        })
    }

    console.log("Roles and permissions seeded successfully.")
}

main() 