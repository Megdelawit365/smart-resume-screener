import { z } from "zod"

export const parsedResumeResultSchema = z.object({
    skills: z.array(z.string()).min(1).max(50),
    alignmentScore: z.number().int().min(0).max(100),
    skillGaps: z.array(z.string()).max(20),
    summary: z.string().min(1).max(500),
})

export type ParsedResumeResult = z.infer<typeof parsedResumeResultSchema>  