import { Router } from "express"
import * as controllers from "../controllers/job.controller.js"
import { authenticate } from "../middlewares/authenticate.middleware.js"
import { requirePermission } from "../middlewares/permission.middleware.js"
import { validate } from "../middlewares/validate.middleware.js"
import { asyncHandler } from "../utils/async-handler.js"
import { JobSchema } from "../schemas/job.schema.js"

const jobRouter = Router()

jobRouter.get(
    "/",
    authenticate,
    requirePermission("jobs:read"),
    asyncHandler(controllers.getAllJobs)
)

jobRouter.get(
    "/me",
    authenticate,
    requirePermission("jobs:read"),
    asyncHandler(controllers.getCurrentUserJobs)
)

jobRouter.get(
    "/:id",
    authenticate,
    requirePermission("jobs:read"),
    asyncHandler(controllers.getJobByID)
)

jobRouter.post(
    "/",
    authenticate,
    requirePermission("jobs:create"),
    validate(JobSchema),
    asyncHandler(controllers.createJob)
)

jobRouter.patch(
    "/:id",
    authenticate,
    requirePermission("jobs:update"),
    validate(JobSchema),
    asyncHandler(controllers.editJob)
)

jobRouter.delete(
    "/:id",
    authenticate,
    requirePermission("jobs:delete"),
    asyncHandler(controllers.deleteJob)
)

jobRouter.patch(
    "/:id/close",
    authenticate,
    requirePermission("jobs:update"),
    asyncHandler(controllers.closeJob)
)

jobRouter.patch(
    "/:id/reopen",
    authenticate,
    requirePermission("jobs:update"),
    asyncHandler(controllers.reopenJob)
)

export default jobRouter