import { prisma } from "../../src/lib/prisma.js"
import type { TestUser } from "./auth.js"

export async function createTestJob(
    recruiterId: string,
    title: string = "Backend Engineer",
    description: string = "Build APIs",
    location: "REMOTE" | "ON_SITE" = "REMOTE",
    budget: number = 1000,
    status: "OPEN" | "CLOSED" = "OPEN",
    experienceLevel: "ENTRY_LEVEL" | "INTERMEDIATE" | "EXPERT" = "INTERMEDIATE",
    requirements: string[] = ["Node.js", "TypeScript"]
) {
    return prisma.job.create({
        data: {
            title,
            description,
            location,
            budget,
            experienceLevel,
            requirements,
            recruiter: { connect: { id: recruiterId } },
        },
    })
}

export async function createTestApplication(
    userId: string,
    jobId: string,
    status: "SUBMITTED" | "SHORTLISTED" | "HIRED" | "REJECTED" | "WITHDRAWN" = "SUBMITTED",
    coverLetter: string = "I am interested"
) {
    return prisma.application.create({
        data: {
            applicant: { connect: { id: userId } },
            job: { connect: { id: jobId } },
            coverLetter,
            status,
            resumeUrl: "https://example.com/resume.pdf",
            resumeName: "resume.pdf",
            resumeSize: 12345,
            resumeMime: "application/pdf",
        },
    })
}


export async function createTestEvaluation(
    applicationId: string,
    jobId: string,
    alignmentScore: number = 80,
    extractedSkills: string[] = ["Node.js", "TypeScript"],
    skillGaps: string[] = ["Docker"],
    summary: string = "Strong match for backend role"
) {
    return prisma.aIEvaluation.create({
        data: {
            applicationId,
            jobId,
            alignmentScore,
            extractedSkills,
            skillGaps,
            summary
        }
    })
}