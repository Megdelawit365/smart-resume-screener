import { afterAll, beforeEach, describe, expect, it } from "vitest"
import request from "supertest"
import { app } from "../src/app.js"
import { prisma } from "../src/lib/prisma.js"
import { cleanDatabase } from "./helpers/db.js"
import { seedRolesAndPermissions } from "./helpers/seed.js"
import { createTestUser } from "./helpers/auth.js"

const USER = {
    email: "logout@example.com",
    password: "123456789123456789",
    name: "Logout one",
    role: "APPLICANT"
}


describe("POST /api/auth/logout", () => {
    beforeEach(async () => {
        await cleanDatabase()
        await seedRolesAndPermissions()

    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("revokes the current session", async () => {
        const agent = request.agent(app)
        await request(app).post("/api/auth/register").send(USER)
        await agent.post("/api/auth/login").send({
            email: USER.email,
            password: USER.password
        })

        const res = await agent.post("/api/auth/logout")
        expect(res.status).toBe(200)

        const session = await prisma.authSession.findFirst()
        expect(session!.revokedAt).not.toBeNull()
    })

    it("clears the refresh cookie", async () => {
        const agent = request.agent(app)
        await request(app).post("/api/auth/register").send(USER)
        await agent.post("/api/auth/login").send({
            email: USER.email,
            password: USER.password
        })

        const res = await agent.post("/api/auth/logout")
        const cookies = res.headers["set-cookie"]
        expect(String(cookies)).toMatch(/refresh_token=;/)
    })

    it("returns 200 when there is no cookie", async () => {
        const res = await request(app).post("/api/auth/logout")
        expect(res.status).toBe(200)
    })
})

describe("POST /api/auth/logout-all", () => {
    beforeEach(async () => {
        await cleanDatabase()
        await seedRolesAndPermissions()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("revokes every session for the user", async () => {
        const user = await createTestUser("logout-all@example.com", "APPLICANT")

        await prisma.authSession.create({
            data: {
                userId: user.id,
                currentRefreshDigest: "second",
                expiresAt: new Date(Date.now() + 1000 * 60 * 60),
                userAgent: "other"
            }
        })

        const res = await request(app)
            .post("/api/auth/logout-all")
            .set("Authorization", `Bearer ${user.token}`)

        expect(res.status).toBe(200)

        const active = await prisma.authSession.findMany({
            where: { userId: user.id, revokedAt: null }
        })
        expect(active.length).toBe(0)
    })

    it("returns 401 with no token", async () => {
        const res = await request(app).post("/api/auth/logout-all")
        expect(res.status).toBe(401)
    })

    it("returns 401 with a malformed token", async () => {
        const res = await request(app)
            .post("/api/auth/logout-all")
            .set("Authorization", "Bearer random")
        expect(res.status).toBe(401)
    })
})