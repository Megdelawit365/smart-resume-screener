import type { registerBody } from "../schemas/auth.schema.js"
import { prisma } from "../lib/prisma.js"
import { hashPassword, verifyPassword } from "../utils/password.js"
import { randomUUID } from "crypto"
import { buildRefreshCredential, createRefreshSecret, digestRefreshSecret, equalDigest, REFRESH_TTL_MS } from "../utils/refresh-token.js"
import { createToken } from "../utils/access-token.js"

type RefreshOutcome =
    | { kind: "ok"; credentials: string; expiresAt: Date; accessToken: string }
    | { kind: "reused" }
    | { kind: "invalid" }
    | { kind: "conflict" }

type Parsed = {
    sessionId: string,
    secret: string
} | null


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
        data: { email, name, passwordHash, roleId: existingRole.id },
        select: { id: true, email: true, name: true, roleId: true, createdAt: true }
    })
}

export interface LoginInput {
    email: string,
    password: string,
    userAgent: string | null,
    ipAddress: string | null
}

export const login = async (data: LoginInput) => {
    const { email, password, userAgent, ipAddress } = data
    const existingUser = await prisma.user.findFirst({
        where: { email: email }
    })
    if (!existingUser) {
        throw { status: 401, message: "Invalid email or password." }
    }

    const validPassword = await verifyPassword(existingUser.passwordHash!, password)
    if (!validPassword) {
        throw { status: 401, message: "Invalid email or password." }
    }

    if (!existingUser!.isActive) {
        throw { status: 401, message: "Account disabled." }
    }

    const sessionId = randomUUID()
    const refreshSecret = createRefreshSecret()
    const refreshDigest = digestRefreshSecret(refreshSecret)
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS)

    const session = await prisma.authSession.create({
        data: {
            id: sessionId,
            userId: existingUser.id,
            currentRefreshDigest: refreshDigest,
            expiresAt,
            userAgent: userAgent ? userAgent : "",
            ipAddress: ipAddress ? ipAddress : ""
        }
    })

    const role = await prisma.role.findFirst({ where: { id: existingUser.roleId } })

    const principal = {
        userId: existingUser.id,
        sessionId: sessionId,
        role: role!.name
    }

    const accessToken = await createToken(principal)
    const refreshCredential = await buildRefreshCredential(session.id, refreshSecret)

    const user = {
        id: existingUser.id,
        email: existingUser.email,
        role: role?.name,
        createdAt: existingUser.createdAt
    }

    return { user, accessToken, refreshCredential }

}

export const logoutCurrent = async (parsed: Parsed) => {
    if (!parsed) return

    const session = await prisma.authSession.findUnique({
        where: { id: parsed!.sessionId }
    })

    if (session && !session.revokedAt) {
        const candidate = digestRefreshSecret(parsed!.secret)

        if (equalDigest(candidate, session.currentRefreshDigest)) {
            await prisma.authSession.update({
                where: { id: parsed!.sessionId },
                data: { revokedAt: new Date() }
            })
        }
    }
}

export const logoutAll = async (userId: string) => {
    return prisma.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() }
    })
}

export const refresh = async (parsed: Parsed) => {
    const outcome: RefreshOutcome = await prisma.$transaction(async (tx) => {
        const session = await tx.authSession.findUnique({
            where: { id: parsed!.sessionId },
            include: {
                user: {
                    include: {
                        role: true
                    }
                }
            }
        });
        const now = new Date();

        if (!session || session.expiresAt <= now || session.revokedAt) {
            return { kind: "invalid" }
        }

        const candidate = digestRefreshSecret(parsed!.secret);

        if (!equalDigest(candidate, session.currentRefreshDigest)) {
            await tx.authSession.updateMany({
                where: { id: session.id, revokedAt: null },
                data: { revokedAt: now }
            })
            return { kind: "reused" }
        };

        const nextSecret = createRefreshSecret();
        const nextDigest = digestRefreshSecret(nextSecret);

        const updated = await tx.authSession.updateMany({
            where: {
                id: session.id,
                currentRefreshDigest: session.currentRefreshDigest,
                revokedAt: null,
                expiresAt: { gt: now }
            },
            data: {
                currentRefreshDigest: nextDigest
            }
        });
        if (updated.count !== 1) {
            return { kind: "conflict" }
        };

        const accessToken = createToken({
            userId: session.userId,
            sessionId: session.id,
            role: session.user.role.name
        });

        return {
            kind: "ok",
            credentials: buildRefreshCredential(session.id, nextSecret),
            expiresAt: session.expiresAt,
            accessToken: accessToken
        };
    });

    return outcome
}