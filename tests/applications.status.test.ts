import { afterAll, beforeEach, describe, expect, it } from "vitest"
import request from "supertest"
import { app } from "../src/app.js"
import { prisma } from "../src/lib/prisma.js"
import { cleanDatabase } from "./helpers/db.js"
import { seedRolesAndPermissions } from "./helpers/seed.js"
import { createTestUser } from "./helpers/auth.js"
import { createTestJob, createTestApplication } from "./helpers/factories.js"

async function setup() {
    const recruiter = await createTestUser("rec@example.com", "RECRUITER")
    const other = await createTestUser("other@example.com", "RECRUITER")
    const applicant = await createTestUser("app@example.com", "APPLICANT")
    const job = await createTestJob(recruiter.id)
    const application = await createTestApplication(applicant.id, job.id)

    return { recruiter, other, applicant, job, application }
}

describe("PATCH /api/applications/:id/shortlist", () => {
    beforeEach(async () => {
        await cleanDatabase()
        await seedRolesAndPermissions()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("lets the job owner shortlist", async () => {
        const { recruiter, application } = await setup()

        const res = await request(app)
            .patch(`/api/applications/${application.id}/shortlist`)
            .set("Authorization", `Bearer ${recruiter.token}`)

        expect(res.status).toBe(200)
        expect(res.body.application.status).toBe("SHORTLISTED")
    })

    it("returns 403 for a different recruiter", async () => {
        const { other, application } = await setup()

        const res = await request(app)
            .patch(`/api/applications/${application.id}/shortlist`)
            .set("Authorization", `Bearer ${other.token}`)

        expect(res.status).toBe(403)
    })

    it("returns 403 for an APPLICANT", async () => {
        const { applicant, application } = await setup()

        const res = await request(app)
            .patch(`/api/applications/${application.id}/shortlist`)
            .set("Authorization", `Bearer ${applicant.token}`)

        expect(res.status).toBe(403)
    })

    it("returns 400 when shortlisting a HIRED application", async () => {
        const { recruiter, application } = await setup()
        await prisma.application.update({
            where: { id: application.id },
            data: { status: "HIRED" }
        })

        const res = await request(app)
            .patch(`/api/applications/${application.id}/shortlist`)
            .set("Authorization", `Bearer ${recruiter.token}`)

        expect(res.status).toBe(400)
    })

    it("returns 400 when shortlisting a REJECTED application", async () => {
        const { recruiter, application } = await setup()
        await prisma.application.update({
            where: { id: application.id },
            data: { status: "REJECTED" }
        })

        const res = await request(app)
            .patch(`/api/applications/${application.id}/shortlist`)
            .set("Authorization", `Bearer ${recruiter.token}`)

        expect(res.status).toBe(400)
    })
})

describe("PATCH /api/applications/:id/reject", () => {
    beforeEach(async () => {
        await cleanDatabase()
        await seedRolesAndPermissions()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("lets the job owner reject", async () => {
        const { recruiter, application } = await setup()

        const res = await request(app)
            .patch(`/api/applications/${application.id}/reject`)
            .set("Authorization", `Bearer ${recruiter.token}`)

        expect(res.status).toBe(200)
        expect(res.body.application.status).toBe("REJECTED")
    })

    it("returns 403 for a different recruiter", async () => {
        const { other, application } = await setup()

        const res = await request(app)
            .patch(`/api/applications/${application.id}/reject`)
            .set("Authorization", `Bearer ${other.token}`)

        expect(res.status).toBe(403)
    })

    it("returns 400 when rejecting a HIRED application", async () => {
        const { recruiter, application } = await setup()
        await prisma.application.update({
            where: { id: application.id },
            data: { status: "HIRED" }
        })

        const res = await request(app)
            .patch(`/api/applications/${application.id}/reject`)
            .set("Authorization", `Bearer ${recruiter.token}`)

        expect(res.status).toBe(400)
    })

    it("returns 400 when rejecting a WITHDRAWN application", async () => {
        const { recruiter, application } = await setup()
        await prisma.application.update({
            where: { id: application.id },
            data: { status: "WITHDRAWN" }
        })

        const res = await request(app)
            .patch(`/api/applications/${application.id}/reject`)
            .set("Authorization", `Bearer ${recruiter.token}`)

        expect(res.status).toBe(400)
    })
})

describe("PATCH /api/applications/:id/accept", () => {
    beforeEach(async () => {
        await cleanDatabase()
        await seedRolesAndPermissions()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("lets the job owner hire the applicant", async () => {
        const { recruiter, application } = await setup()
        await prisma.application.update({
            where: { id: application.id },
            data: { status: "SHORTLISTED" }
        })

        const res = await request(app)
            .patch(`/api/applications/${application.id}/accept`)
            .set("Authorization", `Bearer ${recruiter.token}`)

        expect(res.status).toBe(200)
        expect(res.body.application.status).toBe("HIRED")
    })

    it("returns 403 for a different recruiter", async () => {
        const { other, application } = await setup()

        const res = await request(app)
            .patch(`/api/applications/${application.id}/accept`)
            .set("Authorization", `Bearer ${other.token}`)

        expect(res.status).toBe(403)
    })

    it("returns 400 when hiring a SUBMITTED application", async () => {
        const { recruiter, application } = await setup()

        const res = await request(app)
            .patch(`/api/applications/${application.id}/accept`)
            .set("Authorization", `Bearer ${recruiter.token}`)

        expect(res.status).toBe(400)
    })

    it("returns 400 when hiring a REJECTED application", async () => {
        const { recruiter, application } = await setup()
        await prisma.application.update({
            where: { id: application.id },
            data: { status: "REJECTED" }
        })

        const res = await request(app)
            .patch(`/api/applications/${application.id}/accept`)
            .set("Authorization", `Bearer ${recruiter.token}`)

        expect(res.status).toBe(400)
    })
})

describe("DELETE /api/applications/:id", () => {
    beforeEach(async () => {
        await cleanDatabase()
        await seedRolesAndPermissions()
    })

    afterAll(async () => {
        await prisma.$disconnect()
    })

    it("lets the applicant withdraw a SUBMITTED application", async () => {
        const { applicant, application } = await setup()

        const res = await request(app)
            .delete(`/api/applications/${application.id}`)
            .set("Authorization", `Bearer ${applicant.token}`)

        expect(res.status).toBe(200)
        expect(res.body.application.status).toBe("WITHDRAWN")
    })

    it("returns 400 when the status is already HIRED", async () => {
        const { applicant, application } = await setup()

        await prisma.application.update({
            where: { id: application.id },
            data: { status: "HIRED" }
        })

        const res = await request(app)
            .delete(`/api/applications/${application.id}`)
            .set("Authorization", `Bearer ${applicant.token}`)

        expect(res.status).toBe(400)
    })

    it("returns 404 when another applicant tries to withdraw", async () => {
        const { application } = await setup()
        const other = await createTestUser("other-app@example.com", "APPLICANT")

        const res = await request(app)
            .delete(`/api/applications/${application.id}`)
            .set("Authorization", `Bearer ${other.token}`)

        expect(res.status).toBe(404)
    })

    it("returns 400 when withdrawing a REJECTED application", async () => {
        const { applicant, application } = await setup()
        await prisma.application.update({
            where: { id: application.id },
            data: { status: "REJECTED" }
        })

        const res = await request(app)
            .delete(`/api/applications/${application.id}`)
            .set("Authorization", `Bearer ${applicant.token}`)

        expect(res.status).toBe(400)
    })
})