import { z } from "zod"

export const setActiveSchema = z.object({
    body: z.object({ isActive: z.boolean() })
})

export const setRoleSchema = z.object({
    body: z.object({
        role: z.enum(["APPLICANT", "RECRUITER", "ADMIN"])
    })
})