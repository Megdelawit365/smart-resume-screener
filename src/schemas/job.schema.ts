import z from "zod";
import { Currency, ExperienceLevel, JobLocation } from "../generated/prisma/enums.js";

export const JobSchema = z.object({
    body: z.object({
        title: z.string().min(1),
        description: z.string().min(1).max(2000),
        location: z.enum(JobLocation),
        budget: z.float32().min(1),
        currency: z.enum(Currency),
        experienceLevel: z.enum(ExperienceLevel),
        requirements: z
            .array(z.string().trim().min(1, "Requirement can't be empty"))
            .min(1, "At least one requirement is needed")
    })
})

export type JobBody = z.infer<typeof JobSchema>["body"]