import { afterAll, beforeEach, describe, expect, it } from "vitest"
import request from "supertest"
import { app } from "../src/app.js"
import { prisma } from "../src/lib/prisma.js"
import { cleanDatabase } from "./helpers/db.js"
import { seedRolesAndPermissions } from "./helpers/seed.js"
import { createTestUser } from "./helpers/auth.js"
import { createTestJob } from "./helpers/factories.js"

describe("Job routes", () => {
    beforeEach(async () => {
        await cleanDatabase()
        await seedRolesAndPermissions()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    describe("POST /api/jobs", () => {
        it("lets a RECRUITER create a job", async () => {
            const recruiter = await createTestUser("rec@example.com", "RECRUITER")

            const res = await request(app)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${recruiter.token}`)
                .send({
                    title: "Backend Engineer",
                    description: "Build APIs",
                    location: "REMOTE",
                    budget: 1000,
                    experienceLevel: "INTERMEDIATE",
                    requirements: ["Node.js"]
                })

            expect(res.status).toBe(201)
            expect(res.body.job.title).toBe("Backend Engineer")
        })

        it("returns 403 for an APPLICANT", async () => {
            const applicant = await createTestUser("a@example.com", "APPLICANT")

            const res = await request(app)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${applicant.token}`)
                .send({ title: "X", description: "Y" })

            expect(res.status).toBe(403)
        })

        it("returns 400 for invalid body", async () => {
            const recruiter = await createTestUser("rec@example.com", "RECRUITER")

            const res = await request(app)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${recruiter.token}`)
                .send({})

            expect(res.status).toBe(400)
        })

        it("returns 401 with no token", async () => {
            const res = await request(app).post("/api/jobs").send({})
            expect(res.status).toBe(401)
        })
    })

    describe("GET /api/jobs", () => {
        it("returns all jobs", async () => {
            const recruiter = await createTestUser("rec@example.com", "RECRUITER")
            const applicant = await createTestUser("a@example.com", "APPLICANT")
            await createTestJob(recruiter.id)

            const res = await request(app)
                .get("/api/jobs")
                .set("Authorization", `Bearer ${applicant.token}`)

            expect(res.status).toBe(200)
            expect(res.body.jobs.length).toBe(1)
        })
    })

    describe("GET /api/jobs/:id", () => {
        it("returns one job", async () => {
            const recruiter = await createTestUser("rec@example.com", "RECRUITER")
            const applicant = await createTestUser("a@example.com", "APPLICANT")
            const job = await createTestJob(recruiter.id)

            const res = await request(app)
                .get(`/api/jobs/${job.id}`)
                .set("Authorization", `Bearer ${applicant.token}`)

            expect(res.status).toBe(200)
            expect(res.body.job.id).toBe(job.id)
        })
    })

    describe("GET /api/jobs/me", () => {
        it("returns only the recruiter's jobs", async () => {
            const recruiter = await createTestUser("rec@example.com", "RECRUITER")
            const other = await createTestUser("other@example.com", "RECRUITER")
            await createTestJob(recruiter.id)
            await createTestJob(other.id)

            const res = await request(app)
                .get("/api/jobs/me")
                .set("Authorization", `Bearer ${recruiter.token}`)

            expect(res.status).toBe(200)
            expect(res.body.jobs.length).toBe(1)
        })
    })

    describe("PATCH /api/jobs/:id", () => {
        it("lets owner edit", async () => {
            const recruiter = await createTestUser("rec@example.com", "RECRUITER")
            const job = await createTestJob(recruiter.id)

            const res = await request(app)
                .patch(`/api/jobs/${job.id}`)
                .set("Authorization", `Bearer ${recruiter.token}`)
                .send({ title: "Updated Title" })

            expect(res.status).toBe(200)
            expect(res.body.job.title).toBe("Updated Title")
        })

        it("returns 403 for a different recruiter", async () => {
            const owner = await createTestUser("owner@example.com", "RECRUITER")
            const other = await createTestUser("other@example.com", "RECRUITER")
            const job = await createTestJob(owner.id)

            const res = await request(app)
                .patch(`/api/jobs/${job.id}`)
                .set("Authorization", `Bearer ${other.token}`)
                .send({ title: "Hijack" })

            expect(res.status).toBe(403)
        })

        it("returns 404 for unknown id", async () => {
            const recruiter = await createTestUser("rec@example.com", "RECRUITER")

            const res = await request(app)
                .patch("/api/jobs/00000000-0000-0000-0000-000000000000")
                .set("Authorization", `Bearer ${recruiter.token}`)
                .send({ title: "X" })

            expect(res.status).toBe(404)
        })
    })

    describe("DELETE /api/jobs/:id", () => {
        it("lets owner delete", async () => {
            const recruiter = await createTestUser("rec@example.com", "RECRUITER")
            const job = await createTestJob(recruiter.id)

            const res = await request(app)
                .delete(`/api/jobs/${job.id}`)
                .set("Authorization", `Bearer ${recruiter.token}`)

            expect(res.status).toBe(204)
        })

        it("returns 403 for a different recruiter", async () => {
            const owner = await createTestUser("owner@example.com", "RECRUITER")
            const other = await createTestUser("other@example.com", "RECRUITER")
            const job = await createTestJob(owner.id)

            const res = await request(app)
                .delete(`/api/jobs/${job.id}`)
                .set("Authorization", `Bearer ${other.token}`)

            expect(res.status).toBe(403)
        })
    })

    describe("PATCH /api/jobs/:id/close", () => {
        it("closes the job", async () => {
            const recruiter = await createTestUser("rec@example.com", "RECRUITER")
            const job = await createTestJob(recruiter.id)

            const res = await request(app)
                .patch(`/api/jobs/${job.id}/close`)
                .set("Authorization", `Bearer ${recruiter.token}`)

            expect(res.status).toBe(200)
            expect(res.body.job.status).toBe("CLOSED")
        })
    })

})