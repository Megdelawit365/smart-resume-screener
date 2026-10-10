import type { NextFunction, Request, Response } from "express"
import multer from "multer"

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                message: "Maximum allowed file size is 5MB",
            })
        }

        if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({
                message: `Unexpected field: '${err.field}' is not allowed`,
            })
        }

        return res.status(400).json({ message: `Upload error: ${err.message}` })
    }

    return res.status(500).json({ message: "Internal server error" })
}