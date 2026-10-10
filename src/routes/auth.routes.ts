import { Router } from 'express'
import * as controllers from '../controllers/auth.controller.js'
import { RegisterSchema, LoginSchema } from '../schemas/auth.schema.js'
import { asyncHandler } from "../utils/async-handler.js"

const authRouter = Router()


authRouter.post('/register', asyncHandler(controllers.register))
authRouter.post('/login', asyncHandler(controllers.login))

authRouter.post('/refresh', asyncHandler(controllers.refresh))

authRouter.post('/logout', controllers.logoutCurrent)

authRouter.post('/logout-all', controllers.logoutAll)

export default authRouter 