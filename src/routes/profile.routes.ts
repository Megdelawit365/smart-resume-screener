import { Router } from "express"
import * as controllers from "../controllers/profile.controller.js"
import { authenticate } from "../middlewares/authenticate.middleware.js"
import { validate } from "../middlewares/validate.middleware.js"
import { asyncHandler } from "../utils/async-handler.js"
import { updateProfileSchema } from "../schemas/profile.schema.js"

const profileRouter = Router()

profileRouter.get(
    "/me",
    authenticate,
    asyncHandler(controllers.getMe)
)

profileRouter.patch(
    "/me",
    authenticate,
    validate(updateProfileSchema),
    asyncHandler(controllers.updateProfile)
)

export default profileRouter