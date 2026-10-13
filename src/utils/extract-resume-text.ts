import { PDFParse } from "pdf-parse"
import mammoth from "mammoth"

export async function extractResumeText(file: Express.Multer.File): Promise<string> {
    if (file.mimetype === "application/pdf") {
        const parser = new PDFParse({ data: file.buffer })
        try {
            const result = await parser.getText()
            return result.text
        } finally {
            await parser.destroy()
        }
    }

    if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const result = await mammoth.extractRawText({ buffer: file.buffer })
        return result.value
    }

    throw { status: 400, message: "Unsupported resume file type" }
}