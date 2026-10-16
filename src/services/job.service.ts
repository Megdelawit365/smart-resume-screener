import { prisma } from "../lib/prisma.js"
import type { JobBody } from "../schemas/job.schema.js"

export const getAllJobs = async () => {
    return prisma.job.findMany()
}

export const getJobByID = async (jobId: string) => {
    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) throw { status: 404, message: "Job not found" }
    return job
}

export const createJob = async (userId: string, data: JobBody) => {
    return prisma.job.create({
        data: { userId, ...data }
    })
}

async function assertRecruiterOwnsJob(recruiterId: string, jobId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) throw { status: 404, message: "Job not found" }
    if (job.userId !== recruiterId) throw { status: 403, message: "Forbidden" }
    return job
}

export const editJob = async (recruiterId: string, jobId: string, data: JobBody) => {
    await assertRecruiterOwnsJob(recruiterId, jobId)
    return prisma.job.update({
        where: { id: jobId },
        data: { ...data }
    })
}

export const deleteJob = async (recruiterId: string, jobId: string) => {
    await assertRecruiterOwnsJob(recruiterId, jobId)
    return prisma.job.delete({ where: { id: jobId } })
}

export const getCurrentUserJobs = async (userId: string) => {
    return prisma.job.findMany({ where: { userId } })
}

export const closeJob = async (recruiterId: string, jobId: string) => {
    await assertRecruiterOwnsJob(recruiterId, jobId)
    return prisma.job.update({
        where: { id: jobId },
        data: { status: "CLOSED" }
    })
}

export const reopenJob = async (recruiterId: string, jobId: string) => {
    await assertRecruiterOwnsJob(recruiterId, jobId)
    return prisma.job.update({
        where: { id: jobId },
        data: { status: "OPEN" }
    })
}