import type { NextFunction, Request, Response } from "express"

export function requirePermission(permission: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.auth) {
            req.resume()
            return res.status(401).json({ message: "Authentication required" })
        }

        if (!req.auth.permissions.includes(permission)) {
            req.resume()
            return res.status(403).json({ message: "Forbidden" })
        }

        next()
    }
}