import type { Request, Response } from "express";
import * as services from '../services/oauth.service.js';
import { REFRESH_COOKIE_NAME, refreshCookieOptions, REFRESH_TTL_MS, createRefreshSecret, digestRefreshSecret, buildRefreshCredential } from "../utils/refresh-token.js";
import { OAUTH_TRANSACTION_COOKIE, maxAge, encodeOAuthTransaction, decodeOAuthTransaction } from "../utils/oauth.js";
import { createToken } from "../utils/access-token.js";
import { randomUUID } from "node:crypto";
import { prisma } from '../lib/prisma.js';

export async function googleLogin(req: Request, res: Response) {
    try {
        const result = await services.startGoogleOAuth();

        const role = services.resolveSignupRole(req.query.role as string | undefined);

        const transaction = {
            state: result.state,
            nonce: result.nonce,
            codeVerifier: result.codeVerifier,
            role
        };

        const encoded = encodeOAuthTransaction(transaction);

        res.cookie(
            OAUTH_TRANSACTION_COOKIE,
            encoded,
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: maxAge,
                path: '/auth'
            }
        );

        return res.redirect(result.authorizationUrl);
    } catch (error) {
        return res.status(500).json({ message: "Couldn't start Google Auth!" });
    }
}

export async function callback(req: Request, res: Response) {
    try {
        const encoded = req.cookies?.[OAUTH_TRANSACTION_COOKIE];
        if (!encoded) {
            return res.status(400).json({ message: "Transaction not found!" });
        }

        const transaction = decodeOAuthTransaction(encoded);
        if (!transaction) {
            return res.status(400).json({ message: "Invalid Transaction!" });
        }

        res.clearCookie(
            OAUTH_TRANSACTION_COOKIE,
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/auth'
            }
        );

        const callbackUrl = new URL(`${req.protocol}://${req.get("host")}${req.originalUrl}`);

        const result = await services.handleCallback({
            callbackUrl,
            state: transaction.state,
            nonce: transaction.nonce,
            codeVerifier: transaction.codeVerifier,
            role: services.resolveSignupRole(transaction.role)
        });

        const userRole = await prisma.role.findUnique({
            where: { id: result.roleId },
            select: { name: true }
        });

        const user = {
            id: result.id,
            createdAt: result.createdAt,
            email: result.email,
            roleId: result.roleId,
            role: userRole!.name
        };

        const sessionId = randomUUID();
        const refreshSecret = createRefreshSecret();
        const refreshDigest = digestRefreshSecret(refreshSecret);
        const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

        const session = await prisma.authSession.create({
            data: {
                id: sessionId,
                user: { connect: { id: user.id } },
                userAgent: req.headers["user-agent"] ?? "",
                currentRefreshDigest: refreshDigest,
                expiresAt
            }
        });

        const principal = {
            userId: user.id,
            sessionId: sessionId,
            role: user.role
        };

        const accessToken = createToken(principal);
        const refreshCredential = buildRefreshCredential(session.id, refreshSecret);

        res.cookie(
            REFRESH_COOKIE_NAME,
            refreshCredential,
            refreshCookieOptions
        );

        return res.status(200).json({ message: "Authentication Successfully!", accessToken, user: result });
    } catch (error) {
        return res.status(400).json({ message: "Authentication Failed!" });
    }
}