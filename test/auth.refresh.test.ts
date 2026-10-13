import { afterAll, beforeEach, describe, expect, it } from "vitest"
import request from "supertest"
import { app } from "../src/app.js"
import { prisma } from "../src/lib/prisma.js"
import { cleanDatabase } from "./helpers/db.js"
import { seedRolesAndPermissions } from "./helpers/seed.js"

const USER = {
    email: "refresh@example.com",
    password: "123456789123456789",
    name: "Refresh one",
    role: "APPLICANT"
}


describe("POST /api/auth/refresh", () => {
    beforeEach(async () => {
        await cleanDatabase()
        await seedRolesAndPermissions()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("returns a new access token with a valid cookie", async () => {
        const agent = request.agent(app)
        await request(app).post("/api/auth/register").send(USER)
        await agent.post("/api/auth/login").send({
            email: USER.email,
            password: USER.password
        })

        const res = await agent.post("/api/auth/refresh")

        expect(res.status).toBe(200)
        expect(res.body.accessToken).toBeDefined()
    })

    it("rotates the stored refresh digest", async () => {
        const agent = request.agent(app)
        await request(app).post("/api/auth/register").send(USER)
        await agent.post("/api/auth/login").send({
            email: USER.email,
            password: USER.password
        })

        const before = await prisma.authSession.findFirst()
        await agent.post("/api/auth/refresh")
        const after = await prisma.authSession.findFirst()

        expect(after!.currentRefreshDigest).not.toBe(before!.currentRefreshDigest)
    })

    it("returns 401 with no cookie", async () => {
        const res = await request(app).post("/api/auth/refresh")
        expect(res.status).toBe(401)
    })

    it("returns 401 with a wrong cookie", async () => {
        const res = await request(app)
            .post("/api/auth/refresh")
            .set("Cookie", "refresh_token=random")

        expect(res.status).toBe(401)
    })

    it("returns 401 with an unknown session id", async () => {
        const res = await request(app)
            .post("/api/auth/refresh")
            .set("Cookie", "refresh_token=00000000-0000-0000-0000-000000000000.abc")

        expect(res.status).toBe(401)
    })


    it("returns 401 when the session is already revoked", async () => {
        const agent = request.agent(app)
        await request(app).post("/api/auth/register").send(USER)
        await agent.post("/api/auth/login").send({
            email: USER.email,
            password: USER.password
        })

        await prisma.authSession.updateMany({
            data: { revokedAt: new Date() }
        })

        const res = await agent.post("/api/auth/refresh")
        expect(res.status).toBe(401)
    })

    it("returns 401 when the session is expired", async () => {
        const agent = request.agent(app)
        await request(app).post("/api/auth/register").send(USER)
        await agent.post("/api/auth/login").send({
            email: USER.email,
            password: USER.password
        })

        await prisma.authSession.updateMany({
            data: { expiresAt: new Date(Date.now() - 1000) }
        })

        const res = await agent.post("/api/auth/refresh")
        expect(res.status).toBe(401)
    })
})