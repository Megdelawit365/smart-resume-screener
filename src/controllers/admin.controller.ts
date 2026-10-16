import type { Request, Response } from "express"
import * as AdminServices from "../services/admin.service.js"

export const listUsers = async (req: Request, res: Response) => {
    const users = await AdminServices.listUsers()
    return res.status(200).json({ message: "Users retrieved", users })
}

export const setUserActive = async (req: Request<{ id: string }>, res: Response) => {
    const { isActive } = req.body
    const user = await AdminServices.setUserActive(req.params.id, isActive)
    return res.status(200).json({ message: "User status updated", user })
}

export const setUserRole = async (req: Request<{ id: string }>, res: Response) => {
    const { role } = req.body
    const user = await AdminServices.setUserRole(req.params.id, role)
    return res.status(200).json({ message: "User role updated", user })
}

export const listAllJobs = async (req: Request, res: Response) => {
    const jobs = await AdminServices.listAllJobs()
    return res.status(200).json({ message: "Jobs retrieved", jobs })
}

export const listAllApplications = async (req: Request, res: Response) => {
    const applications = await AdminServices.listAllApplications()
    return res.status(200).json({ message: "Applications retrieved", applications })
}