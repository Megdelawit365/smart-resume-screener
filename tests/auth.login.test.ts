import { afterAll, beforeEach, describe, expect, it } from "vitest"
import request from "supertest"
import { app } from "../src/app.js"
import { prisma } from "../src/lib/prisma.js"
import { cleanDatabase } from "./helpers/db.js"
import { seedRolesAndPermissions } from "./helpers/seed.js"

const USER = {
    email: "login@example.com",
    password: "123456789123456789",
    name: "Login one",
    role: "APPLICANT"
}

async function registerUser() {
    return request(app).post("/api/auth/register").send(USER)
}

describe("POST /api/auth/login", () => {
    beforeEach(async () => {
        await cleanDatabase()
        await seedRolesAndPermissions()
        await registerUser()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("logs in with the correct password", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: USER.email,
            password: USER.password
        })

        expect(res.status).toBe(200)
        expect(res.body.user.email).toBe(USER.email)
    })

    it("sets an HttpOnly refresh cookie", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: USER.email,
            password: USER.password
        })

        const cookies = res.headers["set-cookie"]
        expect(cookies).toBeDefined()
        expect(String(cookies)).toMatch(/refresh/i)
        expect(String(cookies)).toMatch(/HttpOnly/i)
    })

    it("does not leak passwordHash", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: USER.email,
            password: USER.password
        })

        expect(res.body.user).not.toHaveProperty("passwordHash")
    })

    it("returns 401 with the wrong password", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: USER.email,
            password: "wrong-password"
        })

        expect(res.status).toBe(401)
    })

    it("returns 401 when the email is unknown", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "wrong@example.com",
            password: USER.password
        })

        expect(res.status).toBe(401)
    })

    it("returns 401 when the account is disabled", async () => {
        await prisma.user.update({
            where: { email: USER.email },
            data: { isActive: false }
        })

        const res = await request(app).post("/api/auth/login").send({
            email: USER.email,
            password: USER.password
        })

        expect(res.status).toBe(401)
    })

    it("returns 400 when the email is missing", async () => {
        const res = await request(app).post("/api/auth/login").send({
            password: USER.password
        })
        expect(res.status).toBe(400)
    })

    it("returns 400 when the password is missing", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: USER.email
        })
        expect(res.status).toBe(400)
    })

    it("creates an AuthSession row", async () => {
        await request(app).post("/api/auth/login").send({
            email: USER.email,
            password: USER.password
        })

        const sessions = await prisma.authSession.findMany()
        expect(sessions.length).toBe(1)
    })

    it("returns the same message for wrong email and wrong password", async () => {
        const badEmail = await request(app).post("/api/auth/login").send({
            email: "wrong@example.com",
            password: USER.password
        })

        const badPass = await request(app).post("/api/auth/login").send({
            email: USER.email,
            password: "wrong-password"
        })

        expect(badEmail.body.message).toBe(badPass.body.message)
    })
})