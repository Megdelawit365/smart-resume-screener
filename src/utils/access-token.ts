import jwt, { type JwtPayload } from "jsonwebtoken"
import { randomUUID } from "node:crypto"
import { env } from "../config/env.js"
import { z } from "zod"
import type { AuthUser } from "../types/express.js"
import { RoleName } from "../generated/prisma/enums.js"

const ACCESS_ISSUER = "smart-resume-screener-auth-api"
const ACCESS_AUDIENCE = "smart-resume-screener-backend-api"

const verifiedAccessPayloadSchema = z.object({
    sub: z.uuid(),
    sid: z.uuid(),
    role: z.enum(["APPLICANT", "RECRUITER", "ADMIN"]),
    permissions: z.array(z.string()),
    email: z.email(),
    iat: z.number(),
    exp: z.number()
})

export function createToken(principal: AuthUser): string {
    return jwt.sign(
        {
            sid: principal.sessionId,
            role: principal.role,
            permissions: principal.permissions,
            email: principal.email
        },
        env.JWT_ACCESS_SECRET,
        {
            algorithm: "HS256",
            subject: principal.userId,
            issuer: ACCESS_ISSUER,
            audience: ACCESS_AUDIENCE,
            jwtid: randomUUID(),
            expiresIn: "15m"
        }
    )
}

export function verifyAccessToken(token: string): AuthUser {
    const untrustedPayload: string | JwtPayload = jwt.verify(
        token,
        env.JWT_ACCESS_SECRET,
        {
            algorithms: ["HS256"],
            issuer: ACCESS_ISSUER,
            audience: ACCESS_AUDIENCE
        }
    )

    if (typeof untrustedPayload === "string") {
        throw new Error("Unexpected JWT Payload!")
    }

    const payload = verifiedAccessPayloadSchema.parse(untrustedPayload)

    return {
        userId: payload.sub,
        sessionId: payload.sid,
        role: payload.role,
        permissions: payload.permissions,
        email: payload.email
    }
}