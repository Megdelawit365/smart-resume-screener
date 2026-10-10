import { z } from "zod"
import { RoleName } from "../generated/prisma/enums.js"

export const passwordSchema = z
    .string()
    .trim()
    .min(12, "Password must be atleast 12 characters")
    .max(128, "Password cannot exceed 128 characters")


export const emailSchema = z
    .email("Enter a valid email address")
    .trim()
    .toLowerCase()
    .max(254, "Email adress cannot exceed 254 characters")

export const RegisterSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1),
        email: emailSchema,
        password: passwordSchema,
        role: z.enum([RoleName.APPLICANT, RoleName.RECRUITER])
    })

})
export const LoginSchema = z.object({
    body: z.object({
        email: emailSchema,
        password: passwordSchema,
    })

})

export type registerBody = z.infer<typeof RegisterSchema>["body"]
export type loginBody = z.infer<typeof LoginSchema>["body"]