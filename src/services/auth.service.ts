import type { registerBody } from "../schemas/auth.schema.js"
import { prisma } from "../lib/prisma.js"
import { hashPassword } from "../utils/password.js"

export const register = async (data: registerBody) => {
    const { email, name, password, role } = data

    const existingUser = await prisma.user.findFirst({
        where: { email: email }
    })
    if (existingUser) {
        throw { status: 409, message: "User already exists." }
    }

    const existingRole = await prisma.role.findFirst({ where: { name: role } })
    if (!existingRole) {
        throw { status: 404, message: "Role does not exist." }
    }

    const passwordHash = await hashPassword(password)
    return await prisma.user.create({
        data: { email, name, passwordHash, roleId: existingRole!.id }
    })
}
export const login = async () => { }
export const logoutCurrent = async () => { }
export const logoutAll = async () => { }