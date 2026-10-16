import type { NextFunction, Request, Response } from "express"
import * as ApplicationServices from "../services/application.service.js"
import { prisma } from "../lib/prisma.js"
import { StorageService } from "../services/storage.service.js"
import { AIService } from "../services/ai.service.js"
import { EmailService } from "../services/email.service.js"
import { extractResumeText } from "../utils/extract-resume-text.js"

export async function applyToJob(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    // creates application
    const userId = req.auth!.userId
    const file = req.file!
    const jobId = req.params.id
    const resumeText = await extractResumeText(req.file!)


    const application = await ApplicationServices.applyToJob(userId, jobId, req.body, file)

    res.status(201).json({
        message: "Application submitted successfully",
        application,
    })

    const job = await prisma.job.findUnique({ where: { id: jobId } })
    const jobTitle = job!.title

    const user = await prisma.user.findUnique({ where: { id: userId } })

    // sends confirmation email
    EmailService.sendApplicationConfirmation(
        req.auth!.email,
        {
            candidateName: user!.name ?? "Candidate",
            jobTitle,
            applicationId: application.id,
        }
    ).catch((err) => {
        console.error('Failed to send confirmation email:', err)
    })

    // Screens resume and adds the evaluations to the db
    AIService.createAIEvaluation(application.id, job!.id, resumeText, job!.description)
        .catch((err) => console.error("AI screening error:", err))
}

export const listMyApplications = async (req: Request, res: Response, next: NextFunction) => {
    const applications = await ApplicationServices.listMyApplications(req.auth!.userId)
    return res.status(200).json({
        message: "Applications retrieved successfully",
        applications
    })
}

export const getMyApplication = async (req: Request<{ id: string }>, res: Response) => {
    const application = await ApplicationServices.getMyApplication(
        req.auth!.userId,
        req.params.id
    )
    return res.status(200).json({
        message: "Application retrieved successfully",
        application
    })
}

export const getApplicationForRecruiter = async (req: Request<{ id: string }>, res: Response) => {
    const application = await ApplicationServices.getApplicationForRecruiter(
        req.auth!.userId,
        req.params.id
    )
    return res.status(200).json({
        message: "Application retrieved successfully",
        application
    })
}

export const withdrawApplication = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const application = await ApplicationServices.withdrawApplication(req.auth!.userId, req.params.id)
    return res.status(200).json({
        message: "Application withdrawn successfully",
        application
    })
}

export const getApplicationEvaluation = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const evaluation = await ApplicationServices.getApplicationEvaluation(req.auth!.userId, req.params.id)
    return res.status(200).json({
        message: "Evaluation retrieved successfully",
        evaluation
    })
}

export const listApplicationsForJob = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const applications = await ApplicationServices.listApplicationsForJob(req.auth!.userId, req.params.id)
    return res.status(200).json({
        message: "Applications for job retrieved successfully",
        applications
    })
}

export const shortlistApplication = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const application = await ApplicationServices.shortlistApplication(req.auth!.userId, req.params.id)
    res.status(200).json({
        message: "Application shortlisted successfully",
        application
    })

    const user = await prisma.user.findUnique({ where: { id: application.userId } })
    const job = await prisma.job.findUnique({ where: { id: application.jobId } })

    EmailService.sendStatusUpdate(
        user!.email,
        user!.name ?? "Candidate",
        job!.title,
        "SHORTLISTED"
    ).catch((err) => console.error("Status email failed:", err))
}

export const rejectApplication = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const application = await ApplicationServices.rejectApplication(req.auth!.userId, req.params.id)
    res.status(200).json({
        message: "Application rejected successfully",
        application
    })

    const user = await prisma.user.findUnique({ where: { id: application.userId } })
    const job = await prisma.job.findUnique({ where: { id: application.jobId } })

    EmailService.sendStatusUpdate(
        user!.email,
        user!.name ?? "Candidate",
        job!.title,
        "REJECTED"
    ).catch((err) => console.error("Status email failed:", err))
}

export const acceptApplication = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const application = await ApplicationServices.acceptApplication(req.auth!.userId, req.params.id)
    res.status(200).json({
        message: "Application accepted successfully",
        application
    })

    const user = await prisma.user.findUnique({ where: { id: application.userId } })
    const job = await prisma.job.findUnique({ where: { id: application.jobId } })

    EmailService.sendStatusUpdate(
        user!.email,
        user!.name ?? "Candidate",
        job!.title,
        "HIRED"
    ).catch((err) => console.error("Status email failed:", err))
}