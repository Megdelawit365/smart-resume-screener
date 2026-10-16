import type { NextFunction, Request, Response } from "express"
import * as JobServices from "../services/job.service.js"

export const getAllJobs = async (req: Request, res: Response, next: NextFunction) => {
    const jobs = await JobServices.getAllJobs()
    return res.status(200).json({ jobs })
}

export const getJobByID = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const job = await JobServices.getJobByID(req.params.id)
    return res.status(200).json({ job })
}

export const createJob = async (req: Request, res: Response, next: NextFunction) => {
    const job = await JobServices.createJob(req.auth!.userId, req.body)
    return res.status(201).json({ job })
}

export const editJob = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const job = await JobServices.editJob(req.auth!.userId, req.params.id, req.body)
    return res.status(200).json({ job })
}

export const deleteJob = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    await JobServices.deleteJob(req.auth!.userId, req.params.id)
    return res.status(204).send()
}

export const getCurrentUserJobs = async (req: Request, res: Response, next: NextFunction) => {
    const jobs = await JobServices.getCurrentUserJobs(req.auth!.userId)
    return res.status(200).json({ jobs })
}

export const closeJob = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const job = await JobServices.closeJob(req.auth!.userId, req.params.id)
    return res.status(200).json({ job })
}

export const reopenJob = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const job = await JobServices.reopenJob(req.auth!.userId, req.params.id)
    return res.status(200).json({ job })
}