import { afterAll, beforeEach, describe, expect, it } from "vitest"
import request from "supertest"
import { app } from "../src/app.js"
import { prisma } from "../src/lib/prisma.js"
import { cleanDatabase } from "./helpers/db.js"
import { seedRolesAndPermissions } from "./helpers/seed.js"
import { createTestUser } from "./helpers/auth.js"
import { createTestJob } from "./helpers/factories.js"
process.on("uncaughtException", (err) => console.error("UNCAUGHT:", err))
process.on("unhandledRejection", (err) => console.error("UNHANDLED:", err))
describe("POST /api/jobs/:id/apply", () => {
    beforeEach(async () => {
        await cleanDatabase()
        await seedRolesAndPermissions()

    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("lets an APPLICANT apply with a valid PDF resume", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")
        const applicant = await createTestUser("app@example.com", "APPLICANT")
        const job = await createTestJob(recruiter.id)

        const res = await request(app)
            .post(`/api/applications/jobs/${job.id}/apply`)
            .set("Authorization", `Bearer ${applicant.token}`)
            .field("coverLetter", "I am very interested")
            .attach("resume", "tests/fixtures/resume.pdf")

        expect(res.status).toBe(201)
        expect(res.body.application.userId).toBe(applicant.id)
        expect(res.body.application.jobId).toBe(job.id)
        expect(res.body.application.status).toBe("SUBMITTED")
        //  pedning because the ai evaluation is done after the response is sent
        expect(res.body.application.aiReviewStatus).toBe("PENDING")
    })

    it("returns 401 when no token is provided", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")
        const job = await createTestJob(recruiter.id)

        const res = await request(app)
            .post(`/api/applications/jobs/${job.id}/apply`)
            .attach("resume", "tests/fixtures/resume.pdf")

        expect(res.status).toBe(401)
    })

    it("returns 403 when a RECRUITER tries to apply", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")
        const job = await createTestJob(recruiter.id)

        const res = await request(app)
            .post(`/api/applications/jobs/${job.id}/apply`)
            .set("Authorization", `Bearer ${recruiter.token}`)
            .attach("resume", "tests/fixtures/resume.pdf")

        expect(res.status).toBe(403)
    })

    it("returns 400 when no file is attached", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")
        const applicant = await createTestUser("app@example.com", "APPLICANT")
        const job = await createTestJob(recruiter.id)

        const res = await request(app)
            .post(`/api/applications/jobs/${job.id}/apply`)
            .set("Authorization", `Bearer ${applicant.token}`)
            .field("coverLetter", "No file here")

        expect(res.status).toBe(400)
    })

    it("returns 400 when the file type is not PDF or DOCX", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")
        const applicant = await createTestUser("app@example.com", "APPLICANT")
        const job = await createTestJob(recruiter.id)

        const res = await request(app)
            .post(`/api/applications/jobs/${job.id}/apply`)
            .set("Authorization", `Bearer ${applicant.token}`)
            .attach("resume", "tests/fixtures/notes.txt")

        expect(res.status).toBe(400)
    })

    it("returns 400 when the file field name is wrong", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")
        const applicant = await createTestUser("app@example.com", "APPLICANT")
        const job = await createTestJob(recruiter.id)

        const res = await request(app)
            .post(`/api/applications/jobs/${job.id}/apply`)
            .set("Authorization", `Bearer ${applicant.token}`)
            .attach("abc", "tests/fixtures/resume.pdf")

        expect(res.status).toBe(400)
    })

    it("returns 404 when the job does not exist", async () => {
        const applicant = await createTestUser("app@example.com", "APPLICANT")

        const res = await request(app)
            .post(`/api/applications/jobs/00000000-0000-0000-0000-000000000000/apply`)
            .set("Authorization", `Bearer ${applicant.token}`)
            .attach("resume", "tests/fixtures/resume.pdf")

        expect(res.status).toBe(404)
    })

    it("creates an AI evaluation in the background", async () => {
        const recruiter = await createTestUser("rec@example.com", "RECRUITER")
        const applicant = await createTestUser("app@example.com", "APPLICANT")
        const job = await createTestJob(recruiter.id)

        const res = await request(app)
            .post(`/api/applications/jobs/${job.id}/apply`)
            .set("Authorization", `Bearer ${applicant.token}`)
            .attach("resume", "tests/fixtures/resume.pdf")

        expect(res.status).toBe(201)

        //  to pause the test so that the ai evaluation can run after application is created
        await new Promise((r) => setTimeout(r, 3000))

        const evaluation = await prisma.aIEvaluation.findFirst({
            where: { applicationId: res.body.application.id }
        })

        expect(evaluation).not.toBeNull()
        expect(evaluation!.alignmentScore).toBeGreaterThanOrEqual(0)
        expect(Array.isArray(evaluation!.extractedSkills)).toBe(true)

    }, 15000)
})