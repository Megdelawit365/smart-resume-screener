import { Router } from "express"
import * as controllers from "../controllers/admin.controller.js"
import { authenticate } from "../middlewares/authenticate.middleware.js"
import { requirePermission } from "../middlewares/permission.middleware.js"
import { validate } from "../middlewares/validate.middleware.js"
import { asyncHandler } from "../utils/async-handler.js"
import { setActiveSchema, setRoleSchema } from "../schemas/admin.schema.js"

const adminRouter = Router()

adminRouter.get(
    "/users",
    authenticate,
    requirePermission("admin:users"),
    asyncHandler(controllers.listUsers)
)
adminRouter.patch(
    "/users/:id/active",
    authenticate,
    requirePermission("admin:users"),
    validate(setActiveSchema),
    asyncHandler(controllers.setUserActive)
)
adminRouter.patch(
    "/users/:id/role",
    authenticate,
    requirePermission("admin:users"),
    validate(setRoleSchema),
    asyncHandler(controllers.setUserRole)
)
adminRouter.get(
    "/jobs",
    authenticate,
    requirePermission("admin:jobs"),
    asyncHandler(controllers.listAllJobs)
)
adminRouter.get(
    "/applications",
    authenticate,
    requirePermission("admin:jobs"),
    asyncHandler(controllers.listAllApplications)
)

export default adminRouter