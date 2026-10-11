import type { NextFunction, Request, Response } from "express"
import { prisma } from "../lib/prisma.js"
import { StorageService } from "../services/storage.service.js"
import { AIService } from "../services/ai.service.js"

export async function applyToJob(req: Request, res: Response, next: NextFunction) {
    // creates application
    const userId = req.auth!.userId
    const file = req.file!
    const { jobId, coverLetter, resumeText, jobDescription } = req.body

    const resumeUrl = await StorageService.uploadFile(file, "resumes")

    const application = await prisma.application.create({
        data: {
            userId,
            jobId,
            resumeUrl,
            resumeName: file.originalname,
            resumeSize: file.size,
            resumeMime: file.mimetype,
            coverLetter: coverLetter ? coverLetter : null
        },
    })

    res.status(201).json({
        message: "Application submitted successfully",
        application,
    })

    // Screens resume and adds the evaluations to the db
    AIService.updateApplication(application.id, resumeText, jobDescription)

}