import nodemailer from "nodemailer"
import { Resend } from "resend"
import { env } from "./env.js"

export const resend = new Resend(env.RESEND_API_KEY)

export const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
}) 