import type { RoleName } from "../generated/prisma/enums.ts";

export interface AuthPrincipal {
    userId: string,
    sessionId: string,
    role: RoleName
}

export interface AuthUser {
    userId: string,
    email: string,
    role: RoleName,
    permissions: string[],
    tokenVersion: number
}

declare global {
    namespace Express {
        interface Request {
            auth?: AuthPrincipal
        }
    }
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser
        }
    }
}

export { }