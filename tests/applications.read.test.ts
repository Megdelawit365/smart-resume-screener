import { afterAll, beforeEach, describe, expect, it } from "vitest"
import request from "supertest"
import { app } from "../src/app.js"
import { prisma } from "../src/lib/prisma.js"
import { cleanDatabase } from "./helpers/db.js"
import { seedRolesAndPermissions } from "./helpers/seed.js"
import { createTestUser } from "./helpers/auth.js"
import { createTestJob, createTestApplication, createTestEvaluation } from "./helpers/factories.js"

describe("GET /api/applications/me", () => {
    beforeEach(async () => {
        await cleanDatabase()
        await seedRolesAndPermissions()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("returns only the current applicant's applications", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")
        const alice = await createTestUser("alice@example.com", "APPLICANT")
        const bob = await createTestUser("bob@example.com", "APPLICANT")
        const job = await createTestJob(recruiter.id)

        await createTestApplication(alice.id, job.id)
        await createTestApplication(bob.id, job.id)

        const res = await request(app)
            .get("/api/applications/me")
            .set("Authorization", `Bearer ${alice.token}`)

        expect(res.status).toBe(200)
        expect(res.body.applications.length).toBe(1)
        expect(res.body.applications[0].userId).toBe(alice.id)
    })

    it("returns an empty array when the applicant has no applications", async () => {
        const alice = await createTestUser("alice@example.com", "APPLICANT")

        const res = await request(app)
            .get("/api/applications/me")
            .set("Authorization", `Bearer ${alice.token}`)

        expect(res.status).toBe(200)
        expect(res.body.applications).toHaveLength(0)
    })

    it("returns 401 without a token", async () => {
        const res = await request(app).get("/api/applications/me")
        expect(res.status).toBe(401)
    })
})

describe("GET /api/applications/me/:id", () => {
    beforeEach(async () => {
        await cleanDatabase()
        await seedRolesAndPermissions()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("returns the application when the applicant owns it", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")
        const applicant = await createTestUser("app@example.com", "APPLICANT")
        const job = await createTestJob(recruiter.id)
        const application = await createTestApplication(applicant.id, job.id)

        const res = await request(app)
            .get(`/api/applications/me/${application.id}`)
            .set("Authorization", `Bearer ${applicant.token}`)

        expect(res.status).toBe(200)
        expect(res.body.application.id).toBe(application.id)
    })

    it("does not leak AI evaluations to the applicant", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")
        const applicant = await createTestUser("app@example.com", "APPLICANT")
        const job = await createTestJob(recruiter.id)
        const application = await createTestApplication(applicant.id, job.id)

        await createTestEvaluation(application.id, job.id)

        const res = await request(app)
            .get(`/api/applications/me/${application.id}`)
            .set("Authorization", `Bearer ${applicant.token}`)

        expect(res.status).toBe(200)
        expect(res.body.application.aievaluations).toBeUndefined()
    })

    it("returns 404 when another applicant tries to read it", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")
        const alice = await createTestUser("alice@example.com", "APPLICANT")
        const bob = await createTestUser("bob@example.com", "APPLICANT")
        const job = await createTestJob(recruiter.id)
        const application = await createTestApplication(alice.id, job.id)

        const res = await request(app)
            .get(`/api/applications/me/${application.id}`)
            .set("Authorization", `Bearer ${bob.token}`)

        expect(res.status).toBe(404)
    })

    it("returns 404 for an unknown application id", async () => {
        const applicant = await createTestUser("app@example.com", "APPLICANT")

        const res = await request(app)
            .get("/api/applications/me/888")
            .set("Authorization", `Bearer ${applicant.token}`)

        expect(res.status).toBe(404)
    })
})

describe("GET /api/applications/:id", () => {
    beforeEach(async () => {
        await cleanDatabase()
        await seedRolesAndPermissions()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("returns the application when the recruiter owns the job", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")
        const applicant = await createTestUser("app@example.com", "APPLICANT")
        const job = await createTestJob(recruiter.id)
        const application = await createTestApplication(applicant.id, job.id)

        const res = await request(app)
            .get(`/api/applications/${application.id}`)
            .set("Authorization", `Bearer ${recruiter.token}`)

        expect(res.status).toBe(200)
        expect(res.body.application.id).toBe(application.id)
    })

    it("includes AI evaluations for the recruiter", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")
        const applicant = await createTestUser("app@example.com", "APPLICANT")
        const job = await createTestJob(recruiter.id)
        const application = await createTestApplication(applicant.id, job.id)

        await createTestEvaluation(application.id, job.id)

        const res = await request(app)
            .get(`/api/applications/${application.id}`)
            .set("Authorization", `Bearer ${recruiter.token}`)

        expect(res.status).toBe(200)
        expect(res.body.application.aievaluations.length).toBe(1)
    })

    it("returns 404 when a different recruiter tries to read it", async () => {
        const owner = await createTestUser("owner@example.com", "RECRUITER")
        const other = await createTestUser("other@example.com", "RECRUITER")
        const applicant = await createTestUser("app@example.com", "APPLICANT")
        const job = await createTestJob(owner.id)
        const application = await createTestApplication(applicant.id, job.id)

        const res = await request(app)
            .get(`/api/applications/${application.id}`)
            .set("Authorization", `Bearer ${other.token}`)

        expect(res.status).toBe(404)
    })

    it("returns 404 when an applicant tries the recruiter endpoint", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")
        const applicant = await createTestUser("app@example.com", "APPLICANT")
        const job = await createTestJob(recruiter.id)
        const application = await createTestApplication(applicant.id, job.id)

        const res = await request(app)
            .get(`/api/applications/${application.id}`)
            .set("Authorization", `Bearer ${applicant.token}`)

        expect(res.status).toBe(404)
    })

    it("returns 404 for an unknown application id", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")

        const res = await request(app)
            .get("/api/applications/888")
            .set("Authorization", `Bearer ${recruiter.token}`)

        expect(res.status).toBe(404)
    })
})

describe("GET /api/applications/jobs/:id/applications", () => {
    beforeEach(async () => {
        await cleanDatabase()
        await seedRolesAndPermissions()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("lets the job owner recruiter list applications", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")
        const applicant = await createTestUser("app@example.com", "APPLICANT")
        const job = await createTestJob(recruiter.id)
        await createTestApplication(applicant.id, job.id)

        const res = await request(app)
            .get(`/api/applications/jobs/${job.id}/applications`)
            .set("Authorization", `Bearer ${recruiter.token}`)

        expect(res.status).toBe(200)
        expect(res.body.applications.length).toBe(1)
    })

    it("returns 403 when a different recruiter tries to list", async () => {
        const owner = await createTestUser("owner@example.com", "RECRUITER")
        const other = await createTestUser("other@example.com", "RECRUITER")
        const applicant = await createTestUser("app@example.com", "APPLICANT")
        const job = await createTestJob(owner.id)
        await createTestApplication(applicant.id, job.id)

        const res = await request(app)
            .get(`/api/applications/jobs/${job.id}/applications`)
            .set("Authorization", `Bearer ${other.token}`)

        expect(res.status).toBe(403)
    })

    it("returns 404 for an unknown job", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")

        const res = await request(app)
            .get("/api/jobs/888/applications")
            .set("Authorization", `Bearer ${recruiter.token}`)

        expect(res.status).toBe(404)
    })
})