import { prisma } from "../../src/lib/prisma.js"
import type { TestUser } from "./auth.js"

export async function createTestJob(
    recruiterId: string,
    title: string,
    description: string,
    location: "REMOTE" | "ON_SITE",
    budget: number,
    experienceLevel: "ENTRY_LEVEL" | "INTERMEDIATE" | "EXPERT",
    requirements: string[]
) {
    return prisma.job.create({
        data: {
            title: title ?? "Backend Engineer",
            description: description ?? "Build APIs",
            location: location ?? "REMOTE",
            budget: budget ?? 1000,
            experienceLevel: experienceLevel ?? "INTERMEDIATE",
            requirements: requirements ?? ["Node.js", "TypeScript"],
            recruiter: { connect: { id: recruiterId } },
        },
    })
}

export async function createTestApplication(
    userId: string,
    jobId: string,
    status: "SUBMITTED" | "SHORTLISTED" | "HIRED" | "REJECTED" | "WITHDRAWN",
    coverLetter: string
) {
    return prisma.application.create({
        data: {
            applicant: { connect: { id: userId } },
            job: { connect: { id: jobId } },
            coverLetter: coverLetter ?? "I am interested",
            status: status ?? "SUBMITTED",
            resumeUrl: "https://example.com/resume.pdf",
            resumeName: "resume.pdf",
            resumeSize: 12345,
            resumeMime: "application/pdf",
        },
    })
}