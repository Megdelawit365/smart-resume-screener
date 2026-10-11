import z from "zod";

export const emailSchema = z
    .email("Enter a valid email address")
    .trim()
    .toLowerCase()
    .max(254, "Email address cannot exceed 254 characters")

export const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1),
        email: emailSchema
    })
})

export type updateProfileBody = z.infer<typeof updateProfileSchema>["body"]