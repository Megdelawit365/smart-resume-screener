import z from "zod";

export const ApplicationSchema = z.object({
    body: z.object({
        coverLetter: z.string().min(1).max(2000).optional(),
    })
})

export type ApplicationBody = z.infer<typeof ApplicationSchema>["body"]