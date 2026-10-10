import { z } from "zod"

const max_file_size = 5 * 1024 * 1024
const allowed_resume_types = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

export const resumeFileSchema = z.object({
    size: z
        .number()
        .max(max_file_size, "File size must not exceed 5MB"),
    mimetype: z
        .string()
        .refine(
            (type) => allowed_resume_types.includes(type),
            "Only PDF and DOCX files are allowed",
        ),
})

export const applyBodySchema = z.object({
    jobId: z.uuid(),
    coverLetter: z.string().trim().max(2000).optional(),
}) 