import { afterAll, beforeEach, describe, expect, it } from "vitest"
import request from "supertest"
import { app } from "../src/app.js"
import { prisma } from "../src/lib/prisma.js"
import { cleanDatabase } from "./helpers/db.js"
import { seedRolesAndPermissions } from "./helpers/seed.js"
import { createTestUser } from "./helpers/auth.js"
import { createTestJob, createTestApplication, createTestEvaluation } from "./helpers/factories.js"

describe("GET /api/applications/:id/evaluation", () => {
    beforeEach(async () => {
        await cleanDatabase()
        await seedRolesAndPermissions()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("returns the evaluation when the recruiter owns the job", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")
        const applicant = await createTestUser("app@example.com", "APPLICANT")
        const job = await createTestJob(recruiter.id)
        const application = await createTestApplication(applicant.id, job.id)

        await createTestEvaluation(
            application.id,
            job.id,
            92,
            ["Node.js", "TypeScript"],
            ["React"],
            "Excellent fit"
        )

        const res = await request(app)
            .get(`/api/applications/${application.id}/evaluation`)
            .set("Authorization", `Bearer ${recruiter.token}`)

        expect(res.status).toBe(200)
        expect(res.body.evaluation.alignmentScore).toBe(92)
        expect(res.body.evaluation.extractedSkills).toContain("Node.js")
        expect(res.body.evaluation.skillGaps).toContain("React")
    })

    it("returns 403 for a recruiter who does not own the job", async () => {
        const owner = await createTestUser("owner@example.com", "RECRUITER")
        const other = await createTestUser("other@example.com", "RECRUITER")
        const applicant = await createTestUser("app@example.com", "APPLICANT")
        const job = await createTestJob(owner.id)
        const application = await createTestApplication(applicant.id, job.id)

        await createTestEvaluation(application.id, job.id)

        const res = await request(app)
            .get(`/api/applications/${application.id}/evaluation`)
            .set("Authorization", `Bearer ${other.token}`)

        expect(res.status).toBe(403)
    })

    it("returns 403 for an APPLICANT", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")
        const applicant = await createTestUser("app@example.com", "APPLICANT")
        const job = await createTestJob(recruiter.id)
        const application = await createTestApplication(applicant.id, job.id)

        await createTestEvaluation(application.id, job.id)

        const res = await request(app)
            .get(`/api/applications/${application.id}/evaluation`)
            .set("Authorization", `Bearer ${applicant.token}`)

        expect(res.status).toBe(403)
    })

    it("returns 404 when the application does not exist", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")

        const res = await request(app)
            .get("/api/applications/00000000-0000-0000-0000-000000000000/evaluation")
            .set("Authorization", `Bearer ${recruiter.token}`)

        expect(res.status).toBe(404)
    })

    it("returns null when no evaluation exists", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")
        const applicant = await createTestUser("app@example.com", "APPLICANT")
        const job = await createTestJob(recruiter.id)
        const application = await createTestApplication(applicant.id, job.id)

        const res = await request(app)
            .get(`/api/applications/${application.id}/evaluation`)
            .set("Authorization", `Bearer ${recruiter.token}`)

        expect(res.status).toBe(200)
        expect(res.body.evaluation).toBeNull()
    })
})