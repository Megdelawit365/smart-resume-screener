import type { NextFunction, Request, Response } from "express"

export function validateUploadedFile(schema: any) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.file) {
            return res.status(400).json({
                message: "File is missing.",
            })
        }

        const result = schema.safeParse({
            size: req.file.size,
            mimetype: req.file.mimetype,
        })

        if (!result.success) {
            return res.status(400).json({
                message: "File validation failed",
                errors: result.error.issues.map((issue: any) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            })
        }

        return next()
    }
}