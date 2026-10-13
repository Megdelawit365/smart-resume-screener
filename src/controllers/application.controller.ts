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
        req.user!.email,
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

}

export const listMyApplications = async (req: Request, res: Response, next: NextFunction) => {
    const applications = await ApplicationServices.listMyApplications(req.user!.userId)
    return res.status(200).json({
        message: "Applications retrieved successfully",
        applications
    })
}

export const getApplicationById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const application = await ApplicationServices.getApplicationById(req.params.id)
    return res.status(200).json({
        message: "Application retrieved successfully",
        application
    })
}

export const withdrawApplication = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const application = await ApplicationServices.withdrawApplication(req.params.id)
    return res.status(200).json({
        message: "Application withdrawn successfully",
        application
    })
}

export const getApplicationEvaluation = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const evaluation = await ApplicationServices.getApplicationEvaluation(req.user!.userId, req.params.id)
    return res.status(200).json({
        message: "Evaluation retrieved successfully",
        evaluation
    })
}

export const listApplicationsForJob = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const applications = await ApplicationServices.listApplicationsForJob(req.params.id)
    return res.status(200).json({
        message: "Applications for job retrieved successfully",
        applications
    })
}

export const shortlistApplication = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const application = await ApplicationServices.shortlistApplication(req.params.id)
    return res.status(200).json({
        message: "Application shortlisted successfully",
        application
    })
}

export const rejectApplication = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const application = await ApplicationServices.rejectApplication(req.params.id)
    return res.status(200).json({
        message: "Application rejected successfully",
        application
    })
}

export const acceptApplication = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const application = await ApplicationServices.acceptApplication(req.params.id)
    return res.status(200).json({
        message: "Application accepted successfully",
        application
    })
}