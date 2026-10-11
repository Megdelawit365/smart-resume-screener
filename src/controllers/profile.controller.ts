import type { NextFunction, Request, Response } from "express";
import * as ProfileServices from "../services/profile.service.js"

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    const profile = await ProfileServices.getMe(req.user!.userId)
    return res.status(200).json({ profile: profile })
}

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    const updatedProfile = await ProfileServices.updateProfile(req.user!.userId, req.body)
    return res.status(200).json({ profile: updateProfile })

}