import { Router } from "express"
import * as controllers from "../controllers/application.controller.js"
import { authenticate } from "../middlewares/authenticate.middleware.js"
import { validate } from "../middlewares/validate.middleware.js"
import { validateUploadedFile } from "../middlewares/validateFile.js"
import { asyncHandler } from "../utils/async-handler.js"
import { upload } from "../config/multer.js"
import { resumeFileSchema } from "../schemas/file.schema.js"
import { ApplicationSchema } from "../schemas/application.schema.js"
import { requirePermission } from "../middlewares/permission.middleware.js"

const applicationRouter = Router()

applicationRouter.post(
    "/jobs/:id/apply",
    upload.single("resume"),
    authenticate,
    requirePermission("application:create"),
    validateUploadedFile(resumeFileSchema),
    validate(ApplicationSchema),
    asyncHandler(controllers.applyToJob)
)

applicationRouter.get(
    "/me",
    authenticate,
    requirePermission("application:read"),
    asyncHandler(controllers.listMyApplications)
)

applicationRouter.get(
    "/me/:id",
    authenticate,
    requirePermission("application:read"),
    asyncHandler(controllers.getMyApplication)
)

applicationRouter.get(
    "/jobs/:id/applications",
    authenticate,
    requirePermission("application:read"),
    asyncHandler(controllers.listApplicationsForJob)
)

applicationRouter.get(
    "/:id/evaluation",
    authenticate,
    requirePermission("ai:read"),
    asyncHandler(controllers.getApplicationEvaluation)
)

applicationRouter.get(
    "/:id",
    authenticate,
    requirePermission("application:read"),
    asyncHandler(controllers.getApplicationForRecruiter)
)

applicationRouter.delete(
    "/:id",
    authenticate,
    requirePermission("application:update"),
    asyncHandler(controllers.withdrawApplication)
)

applicationRouter.patch(
    "/:id/shortlist",
    authenticate,
    requirePermission("application:update"),
    asyncHandler(controllers.shortlistApplication)
)

applicationRouter.patch(
    "/:id/reject",
    authenticate,
    requirePermission("application:update"),
    asyncHandler(controllers.rejectApplication)
)

applicationRouter.patch(
    "/:id/accept",
    authenticate,
    requirePermission("application:update"),
    asyncHandler(controllers.acceptApplication)
)

export default applicationRouter