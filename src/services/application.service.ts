import { prisma } from '../lib/prisma.js'
import type { ApplicationBody } from '../schemas/application.schema.js'
import { AIService } from './ai.service.js'

interface Resume {
    resumeUrl: string
    resumeName: string
    resumeSize: number
    resumeMime: string
}


export const applyToJob = async (userId: string, jobId: string, data: ApplicationBody, resume: Resume) => {
    return await prisma.application.create({
        data: {
            userId: userId,
            jobId: jobId,
            ...data,
            resumeUrl: resume.resumeUrl,
            resumeName: resume.resumeName,
            resumeSize: resume.resumeSize,
            resumeMime: resume.resumeMime,
        }
    })
}

export const listMyApplications = async (userId: string) => {
    return await prisma.application.findMany({ where: { userId } })
}

export const getApplicationById = async (applicationId: string) => {
    return await prisma.application.findUnique({
        where: {
            id: applicationId
        }
    })
}

export const withdrawApplication = async (applicationId: string) => {
    return await prisma.application.update({
        where: {
            id: applicationId
        },
        data: {
            status: "WITHDRAWN"
        }
    })
}


export const getApplicationEvaluation = async (resumeText: string, jobDescription: string) => {
    const evaluation = await AIService.screenResume(resumeText, jobDescription)

    return {
        aiScore: evaluation.alignmentScore,
        aiSkills: evaluation.skills,
        aiGaps: evaluation.skillGaps
    }
}

export const listApplicationsForJob = async (jobId: string) => {
    return await prisma.application.findMany({ where: { jobId } })
}
export const shortlistApplication = async (applicationId: string) => {
    return await prisma.application.update({
        where: {
            id: applicationId
        },
        data: {
            status: "SHORTLISTED"
        }
    })
}
export const rejectApplication = async (applicationId: string) => {
    return await prisma.application.update({
        where: {
            id: applicationId
        },
        data: {
            status: "REJECTED"
        }
    })
}
export const acceptApplication = async (applicationId: string) => {
    return await prisma.application.update({
        where: {
            id: applicationId
        },
        data: {
            status: "HIRED"
        }
    })
}
