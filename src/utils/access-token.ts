import jwt, { type JwtPayload } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto'
import { env } from '../config/env.js';
import { z } from 'zod';
import type { AuthPrincipal } from '../types/express.js';
import { RoleName } from '../generated/prisma/enums.js';


const ACCESS_ISSUER = "smart-resume-screener-auth-api";
const ACCESS_AUDIENCE = "smart-resume-screener-backend-api";

const verifiedAccessPayloadSchema = z.object({
    sub: z.uuid(),
    sid: z.uuid(),
    role: z.enum(RoleName),
    iss: z.literal(ACCESS_ISSUER),
    aud: z.union([
        z.literal(ACCESS_AUDIENCE),
        z.array(z.string()).refine((values) => values.includes(ACCESS_AUDIENCE)),
    ]),
    iat: z.number(),
    exp: z.number(),
    jti: z.uuid(),
});

export function createToken(principal: AuthPrincipal): string {
    return jwt.sign(
        {
            sid: principal.sessionId,
            role: principal.role
        },
        env.JWT_ACCESS_SECRET,
        {
            algorithm: 'HS256',
            subject: principal.userId,
            issuer: ACCESS_ISSUER,
            audience: ACCESS_AUDIENCE,
            jwtid: randomUUID(),
            expiresIn: '15m'
        }
    )
};

export function verifyAccessToken(token: string): AuthPrincipal {
    const untrustedPayload: string | JwtPayload = jwt.verify(
        token,
        env.JWT_ACCESS_SECRET,
        {
            algorithms: ["HS256"],
            issuer: ACCESS_ISSUER,
            audience: ACCESS_AUDIENCE
        }
    )

    if (typeof untrustedPayload === 'string') {
        throw new Error("Unexpected JWT Payload!")
    }
    const payload = verifiedAccessPayloadSchema.parse(untrustedPayload);

    return {
        userId: payload.sub,
        sessionId: payload.sid,
        role: payload.role
    }
};