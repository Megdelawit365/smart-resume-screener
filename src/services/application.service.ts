import { prisma } from "../lib/prisma.js"
import type { ApplicationBody } from "../schemas/application.schema.js"
import { StorageService } from "./storage.service.js"

export const applyToJob = async (
    userId: string,
    jobId: string,
    data: ApplicationBody,
    file: Express.Multer.File
) => {
    const resumeUrl = await StorageService.uploadFile(file, "resumes")

    return await prisma.application.create({
        data: {
            userId,
            jobId,
            coverLetter: data.coverLetter ?? null,
            resumeUrl,
            resumeName: file.originalname,
            resumeSize: file.size,
            resumeMime: file.mimetype
        }
    })
}

export const listMyApplications = async (userId: string) => {
    return await prisma.application.findMany({
        where: { userId },
        include: { aievaluations: true }
    })
}

export const getMyApplication = async (userId: string, applicationId: string) => {
    const application = await prisma.application.findFirst({
        where: { id: applicationId, userId }
    })

    if (!application) {
        throw { status: 404, message: "Application not found" }
    }

    return application
}

export const getApplicationForRecruiter = async (recruiterId: string, applicationId: string) => {
    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { job: true, aievaluations: true }
    })

    if (!application) {
        throw { status: 404, message: "Application not found" }
    }

    if (application.job.userId !== recruiterId) {
        throw { status: 404, message: "Application not found" }
    }

    return application
}

export const withdrawApplication = async (userId: string, applicationId: string) => {
    const application = await prisma.application.findFirst({
        where: { id: applicationId, userId }
    })

    if (!application) {
        throw { status: 404, message: "Application not found" }
    }

    if (application.status !== "SUBMITTED" && application.status !== "SHORTLISTED") {
        throw { status: 400, message: "Cannot withdraw at this stage" }
    }

    return prisma.application.update({
        where: { id: applicationId },
        data: { status: "WITHDRAWN" }
    })
}

export const getApplicationEvaluation = async (recruiterId: string, applicationId: string) => {
    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { job: true, aievaluations: true }
    })

    if (!application) {
        throw { status: 404, message: "Application not found" }
    }

    if (application.job.userId !== recruiterId) {
        throw { status: 403, message: "Forbidden" }
    }

    return application.aievaluations[0] ?? null
}

export const listApplicationsForJob = async (recruiterId: string, jobId: string) => {
    const job = await prisma.job.findUnique({ where: { id: jobId } })

    if (!job) {
        throw { status: 404, message: "Job not found" }
    }

    if (job.userId !== recruiterId) {
        throw { status: 403, message: "Forbidden" }
    }

    return prisma.application.findMany({
        where: { jobId },
        include: { aievaluations: true }
    })
}

async function checkRecuriterApplicationOwnership(recruiterId: string, applicationId: string, allowedStatuses: string[]) {
    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { job: true }
    })

    if (!application) {
        throw { status: 404, message: "Application not found" }
    }

    if (application.job.userId !== recruiterId) {
        throw { status: 403, message: "Forbidden" }
    }
    if (!allowedStatuses.includes(application.status)) {
        throw {
            status: 400,
            message: `Cannot perform this action at this stage`
        }
    }

    return application
}
export const shortlistApplication = async (recruiterId: string, applicationId: string) => {
    await checkRecuriterApplicationOwnership(recruiterId, applicationId, ["SUBMITTED"])
    return prisma.application.update({
        where: { id: applicationId },
        data: { status: "SHORTLISTED" }
    })
}

export const rejectApplication = async (recruiterId: string, applicationId: string) => {
    await checkRecuriterApplicationOwnership(recruiterId, applicationId, ["SUBMITTED", "SHORTLISTED"])
    return prisma.application.update({
        where: { id: applicationId },
        data: { status: "REJECTED" }
    })
}

export const acceptApplication = async (recruiterId: string, applicationId: string) => {
    await checkRecuriterApplicationOwnership(recruiterId, applicationId, ["SHORTLISTED"])
    return prisma.application.update({
        where: { id: applicationId },
        data: { status: "HIRED" }
    })
}