import { prisma } from '../lib/prisma.js'
import type { JobBody } from '../schemas/job.schema.js'

export const getAllJobs = async () => {
    return await prisma.job.findMany()
}
export const getJobByID = async (jobId: string) => {
    return await prisma.job.findUnique({ where: { id: jobId } })
}
export const createJob = async (userId: string, data: JobBody) => {
    return await prisma.job.create({
        data: {
            userId: userId,
            ...data
        }
    })
}
export const editJob = async (jobId: string, data: JobBody) => {
    return await prisma.job.update({
        where: { id: jobId },
        data: {
            ...data
        }
    })
}
export const deleteJob = async (jobId: string) => {
    return await prisma.job.delete({
        where: { id: jobId },
    })
}

export const getCurrentUserJobs = async (userId: string) => {
    return await prisma.job.findMany({
        where: { userId: userId },
    })
}

export const closeJob = async (jobId: string) => {
    return await prisma.job.update({
        where: { id: jobId },
        data: {
            status: "CLOSED"
        }
    })
}

export const reopenJob = async (jobId: string) => {
    return await prisma.job.update({
        where: { id: jobId },
        data: {
            status: "OPEN"
        }
    })
}
