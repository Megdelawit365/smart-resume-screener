import type { NextFunction, Request, Response } from "express"
import { verifyAccessToken } from "../utils/access-token.js"

export function authenticate(req: Request, res: Response, next: NextFunction) {
    const authorization = req.header("authorization")

    if (!authorization) {
        req.resume()
        return res.status(401).json({ message: "Authentication required" })
    }

    const [scheme, token, extra] = authorization.trim().split(/\s+/)

    if (scheme?.toLowerCase() !== "bearer" || !token || extra) {
        req.resume()
        return res.status(401).json({ message: "Invalid authorization header" })
    }

    try {
        req.auth = verifyAccessToken(token)
        return next()
    } catch (err) {
        console.error("AUTH FAILED:", err)
        req.resume()
        return res.status(401).json({ message: "Invalid or expired access token" })
    }
}