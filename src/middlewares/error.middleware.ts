import type { NextFunction, Request, Response } from "express"
import multer from "multer"
import { ZodError } from "zod"

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    if (err instanceof ZodError) {
        console.log("ZOD ISSUES:", JSON.stringify(err.issues, null, 2))   // ← add this

        return res.status(400).json({
            message: "Validation failed",
            errors: err.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message
            }))
        })
    }

    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                message: "Maximum allowed file size is 5MB"
            })
        }

        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({
                message: `Unexpected field: '${err.field}' is not allowed`
            })
        }

        return res.status(400).json({ message: `Upload error: ${err.message}` })
    }


    const status = err.status || 500
    const message = err.message || "Internal server error"
    return res.status(status).json({ error: message })
}