import { app } from "./app.js"
import { env } from "./config/env.js"
import { prisma } from "./lib/prisma.js"

const server = app.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}`)
})
