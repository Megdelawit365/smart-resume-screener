import crypto from "crypto"
import path from "path"
import { env } from "../config/env.js"
import { supabase } from "../lib/storage.js"

export class StorageService {
    static async uploadFile(file: Express.Multer.File, folder: "resumes" | "avatars",): Promise<string> {
        const fileExtension = path.extname(file.originalname).toLowerCase()
        const uniqueFileName = `${folder}/${crypto.randomUUID()}${fileExtension}`

        const { data, error } = await supabase.storage
            .from(env.SUPABASE_STORAGE_BUCKET)
            .upload(uniqueFileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            })

        if (error) {
            throw new Error(`Cloud storage upload failed: ${error.message}`)
        }

        const { data: publicUrlData } = supabase.storage
            .from(env.SUPABASE_STORAGE_BUCKET)
            .getPublicUrl(data.path)

        return publicUrlData.publicUrl
    }

    static async deleteFile(filePath: string): Promise<void> {
        const { error } = await supabase.storage
            .from(env.SUPABASE_STORAGE_BUCKET)
            .remove([filePath])

        if (error) {
            console.error(`Failed to delete asset from bucket: ${error.message}`)
        }
    }
}