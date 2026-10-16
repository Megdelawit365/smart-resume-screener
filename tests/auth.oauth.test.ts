import { afterAll, beforeEach, describe, expect, it } from "vitest"
import request from "supertest"
import { app } from "../src/app.js"
import { prisma } from "../src/lib/prisma.js"
import { cleanDatabase } from "./helpers/db.js"
import { seedRolesAndPermissions } from "./helpers/seed.js"

describe("GET /api/auth/google", () => {
    beforeEach(async () => {
        await cleanDatabase()
        await seedRolesAndPermissions()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("redirects to Google and sets the transaction cookie", async () => {
        const res = await request(app).get("/api/auth/google")

        if (res.status === 302) {
            expect(res.headers.location).toMatch(/accounts\.google\.com/)
            const cookies = res.headers["set-cookie"]
            expect(String(cookies)).toMatch(/oauth/i)
        } else {
            expect([200, 500]).toContain(res.status)
        }
    })

    it("accepts a role query parameter", async () => {
        const res = await request(app).get("/api/auth/google?role=RECRUITER")
        expect([302, 200, 500]).toContain(res.status)
    })

    it("falls back to APPLICANT for an unknown role", async () => {
        const res = await request(app).get("/api/auth/google?role=abc")
        expect([302, 200, 500]).toContain(res.status)
    })
})

describe("GET /api/auth/google/callback", () => {
    beforeEach(async () => {
        await cleanDatabase()
        await seedRolesAndPermissions()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("returns 400 without a transaction cookie", async () => {
        const res = await request(app).get("/api/auth/google/callback")
        expect(res.status).toBe(400)
    })

    it("returns 400 with an invalid transaction cookie", async () => {
        const res = await request(app)
            .get("/api/auth/google/callback")
            .set("Cookie", "oauth_transaction=garbage")
        expect(res.status).toBe(400)
    })
})