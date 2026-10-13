import type { Request, Response, NextFunction } from "express"
import { LoginSchema, RegisterSchema } from "../schemas/auth.schema.js"
import type { loginBody, registerBody } from "../schemas/auth.schema.js"
import * as services from "../services/auth.service.js"
import { parseRefreshCredential, REFRESH_COOKIE_NAME, refreshCookieBaseOptions, refreshCookieOptions, } from "../utils/refresh-token.js"
import { EmailService } from "../services/email.service.js"

export const register = async (req: Request<{}, {}, registerBody>, res: Response) => {
    const { email, password, name, role } = RegisterSchema.parse({ body: req.body }).body

    const user = await services.register({ email, password, name, role })
    res.status(201).json({
        message: "Successfully registered",
        user,
    })

    EmailService.sendWelcomeEmail(user.email, user.name)
        .catch((err) => {
            console.error("Failed to send welcome email:", err);
        })
}


export const login = async (req: Request<{}, {}, loginBody>, res: Response) => {
    const { email, password } = LoginSchema.parse({ body: req.body }).body

    const userAgent = req.get("user-agent")?.slice(0, 500) ?? null
    const ipAddress = req.ip?.slice(0, 45) ?? null

    const { user, accessToken, refreshCredential } = await services.login({ email, password, userAgent, ipAddress })

    res.cookie(REFRESH_COOKIE_NAME, refreshCredential, refreshCookieOptions)

    return res.status(200).json({
        message: "Login successful",
        accessToken,
        user,
    })
}

export const logoutCurrent = async (req: Request, res: Response) => {
    const parsed = parseRefreshCredential(req.cookies?.[REFRESH_COOKIE_NAME])

    if (!parsed) {
        res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieBaseOptions)
        return res.status(200).json({ message: "Logged out" })
    }

    await services.logoutCurrent(parsed)
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieBaseOptions)

    return res.status(200).json({ message: "Logged out" })
}

export const logoutAll = async (req: Request, res: Response) => {
    const principal = req.auth!
    await services.logoutAll(principal.userId)

    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieBaseOptions)
    return res.status(200).json({ message: "Logged out on all devices" })
}

export async function refresh(req: Request, res: Response) {
    const parsed = parseRefreshCredential(req.cookies?.[REFRESH_COOKIE_NAME])

    if (!parsed) {
        res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieBaseOptions)
        return res.status(401).json({ message: "Refresh Session Required!" })
    }
    const outcome = await services.refresh(parsed)

    if (outcome.kind === "conflict") {
        return res.status(409).json({ message: "Refresh already used  retry with the newest credential" })
    }

    if (outcome.kind === "invalid" || outcome.kind === "reused") {
        res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieBaseOptions)
        return res.status(401).json({
            message:
                outcome.kind === "invalid"
                    ? "Invalid or expired refresh session"
                    : "Refresh credential reuse detected  session revoked"
        })
    }

    const remaining = Math.max(
        0,
        outcome.expiresAt.getTime() - Date.now()
    )

    res.cookie(
        REFRESH_COOKIE_NAME,
        outcome.credentials,
        {
            ...refreshCookieBaseOptions,
            maxAge: remaining
        })

    return res.status(200).json({
        accessToken: outcome.accessToken
    })
}