import { afterAll, beforeEach, describe, expect, it } from "vitest"
import request from "supertest"
import { app } from "../src/app.js"
import { prisma } from "../src/lib/prisma.js"
import { cleanDatabase } from "./helpers/db.js"
import { seedRolesAndPermissions } from "./helpers/seed.js"

describe("POST /api/auth/register", () => {
    beforeEach(async () => {
        await cleanDatabase()
        await seedRolesAndPermissions()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("registers an APPLICANT successfully", async () => {
        const res = await request(app).post("/api/auth/register").send({
            email: "applicant@example.com",
            password: "123456789123456789",
            name: "Applicant One",
            role: "APPLICANT"
        })

        expect(res.status).toBe(201)
        expect(res.body.user.email).toBe("applicant@example.com")
        expect(res.body.user.name).toBe("Applicant One")
        expect(res.body.user).not.toHaveProperty("passwordHash")
    })

    it("registers a RECRUITER successfully", async () => {
        const res = await request(app).post("/api/auth/register").send({
            email: "recruiter@example.com",
            password: "123456789123456789",
            name: "Recruiter One",
            role: "RECRUITER"
        })

        expect(res.status).toBe(201)
        expect(res.body.user.email).toBe("recruiter@example.com")
    })

    it("returns 409 when the email already exists", async () => {
        await request(app).post("/api/auth/register").send({
            email: "dup@example.com",
            password: "123456789123456789",
            name: "First",
            role: "APPLICANT"
        })

        const res = await request(app).post("/api/auth/register").send({
            email: "dup@example.com",
            password: "123456789123456789",
            name: "Second",
            role: "APPLICANT"
        })

        expect(res.status).toBe(409)
    })

    it("returns 400 when the role does not exist", async () => {
        const res = await request(app).post("/api/auth/register").send({
            email: "no-role@example.com",
            password: "123456789123456789",
            name: "No Role",
            role: "123"
        })

        expect(res.status).toBe(400)
    })

    it("returns 400 when the email is invalid", async () => {
        const res = await request(app).post("/api/auth/register").send({
            email: "not-an-email",
            password: "123456789123456789",
            name: "Bad email",
            role: "APPLICANT"
        })

        expect(res.status).toBe(400)
    })

    it("returns 400 when the password is too short", async () => {
        const res = await request(app).post("/api/auth/register").send({
            email: "short@example.com",
            password: "123",
            name: "Short password",
            role: "APPLICANT"
        })

        expect(res.status).toBe(400)
    })

    it("returns 400 when the name is missing", async () => {
        const res = await request(app).post("/api/auth/register").send({
            email: "noname@example.com",
            password: "123456789123456789",
            role: "APPLICANT"
        })

        expect(res.status).toBe(400)
    })

    it("returns 400 when the role is missing", async () => {
        const res = await request(app).post("/api/auth/register").send({
            email: "norole@example.com",
            password: "123456789123456789",
            name: "No Role"
        })

        expect(res.status).toBe(400)
    })

    it("returns 400 when the body is empty", async () => {
        const res = await request(app).post("/api/auth/register").send({})
        expect(res.status).toBe(400)
    })

    it("does not leak passwordHash in the response", async () => {
        const res = await request(app).post("/api/auth/register").send({
            email: "leak@example.com",
            password: "123456789123456789",
            name: "Leak test",
            role: "APPLICANT"
        })

        expect(res.body.user).not.toHaveProperty("passwordHash")
        expect(res.body.user).not.toHaveProperty("tokenVersion")
    })

    it("stores the password as an Argon2id hash", async () => {
        await request(app).post("/api/auth/register").send({
            email: "hash@example.com",
            password: "123456789123456789",
            name: "Hash test",
            role: "APPLICANT"
        })

        const stored = await prisma.user.findUnique({ where: { email: "hash@example.com" } })
        expect(stored!.passwordHash).toMatch(/^\$argon2/)
    })
})