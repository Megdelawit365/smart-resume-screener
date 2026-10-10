import { Router } from "express" 
import { upload } from "../config/multer.js" 
import { applyToJob } from "../controllers/resume.controller.js" 
import { validateUploadedFile } from "../middlewares/validateFile.js" 
import { resumeFileSchema } from "../schemas/file.schema.js" 

const router = Router() 

router.post(
    "/applications",
    upload.single("resume"),
    validateUploadedFile(resumeFileSchema),
    applyToJob,
)

export default router 