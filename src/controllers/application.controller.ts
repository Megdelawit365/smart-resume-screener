import { prisma } from '../lib/prisma.js'
import type { NextFunction, Request, Response } from "express";
import * as ApplicationServices from "../services/application.service.js"
import { StorageService } from "../services/storage.service.js"
export const applyToJob = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const resumeUrl = await StorageService.uploadFile(req.file!, "resumes")
    const application = await ApplicationServices.applyToJob(
        req.user!.userId,
        req.params.id,
        req.body,
        {
            resumeUrl,
            resumeName: req.file!.originalname,
            resumeSize: req.file!.size,
            resumeMime: req.file!.mimetype
        }
    )
    return res.status(201).json({ application: application })
}

export const listMyApplications = async (req: Request, res: Response, next: NextFunction) => {
    const applications = await ApplicationServices.listMyApplications(req.user!.userId)
    return res.status(200).json({ applications: applications })
}

export const getApplicationById = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const application = await ApplicationServices.listMyApplications(req.params.id)
    return res.status(200).json({ application: application })
}

export const withdrawApplication = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const application = await ApplicationServices.withdrawApplication(req.params.id)
    return res.status(200).json({ application: application })
}

export const getApplicationEvaluation = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const application = await ApplicationServices.getApplicationEvaluation(req.body.resumeText, req.body.jobDescription)
    return res.status(200).json({ application: application })
}

export const listApplicationsForJob = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const applications = await ApplicationServices.listApplicationsForJob(req.params.id)
    return res.status(200).json({ applications: applications })
}

export const shortlistApplication = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const application = await ApplicationServices.shortlistApplication(req.params.id)
    return res.status(200).json({ application: application })
}

export const rejectApplication = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const application = await ApplicationServices.rejectApplication(req.params.id)
    return res.status(200).json({ application: application })
}

export const acceptApplication = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const application = await ApplicationServices.acceptApplication(req.params.id)
    return res.status(200).json({ application: application })
}
