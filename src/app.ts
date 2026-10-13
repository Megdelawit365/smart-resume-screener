import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import helmet from "helmet"
import { env } from "./config/env.js"
import { errorHandler } from "./middlewares/error.middleware.js"
import authRouter from "./routes/auth.routes.js"
import userRouter from "./routes/auth.routes.js"
import resumeRouter from "./routes/resume.routes.js"
// import jobRouter from "./routes/job.routes.js"
// import applicationRouter from "./routes/application.routes.js"

export const app = express()

if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1)
}

app.use(helmet())
app.use(
    cors({
        origin: env.FRONTEND_ORIGIN,
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    })
)
app.use(express.json({ limit: "20kb" }))
app.use(cookieParser())

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" })
})

app.use("/api/auth", authRouter)
app.use("/api/users", userRouter)
// app.use("/api/jobs", jobRouter)
// app.use("/api/applications", applicationRouter)
app.use("/api", resumeRouter)

app.use(errorHandler)