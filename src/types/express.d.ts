import type { RoleName } from "../generated/prisma/enums.ts"

export interface AuthUser {
    userId: string
    sessionId: string
    role: RoleName
    email: string
    permissions: string[]
}

declare global {
    namespace Express {
        interface Request {
            auth?: AuthUser
        }
    }
}

export { }