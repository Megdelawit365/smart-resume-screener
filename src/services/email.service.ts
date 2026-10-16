import { env } from "../config/env.js";
import { resend, transporter } from "../config/mail.js";
import { applicationConfirmationTemplate, statusUpdateTemplate, shortlistInviteTemplate, welcomeEmailTemplate, type ApplicationEmailProps, } from "../templates/email.template.js";

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

export class EmailService {
    private static async send(options: SendEmailOptions): Promise<void> {
        if (env.NODE_ENV === "test") return

        const isProduction = env.NODE_ENV === "production"

        if (isProduction) {
            const { error } = await resend.emails.send({
                from: env.EMAIL_FROM,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });

            if (error) {
                throw new Error(`Resend delivery failed: ${error.message}`);
            }
        } else {
            await transporter.sendMail({
                from: env.EMAIL_FROM,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });
        }
    }

    static async sendWelcomeEmail(to: string, name: string): Promise<void> {
        await this.send({
            to,
            subject: "Welcome to Resume Screener",
            html: welcomeEmailTemplate(name),
        });
    }

    static async sendApplicationConfirmation(to: string, details: ApplicationEmailProps): Promise<void> {
        await this.send({
            to,
            subject: `Application received: ${details.jobTitle}`,
            html: applicationConfirmationTemplate(details)
        });
    }

    static async sendStatusUpdate(
        to: string,
        candidateName: string,
        jobTitle: string,
        status: string,
    ): Promise<void> {
        await this.send({
            to,
            subject: `Application update: ${jobTitle}`,
            html: statusUpdateTemplate(candidateName, jobTitle, status),
        });
    }

    static async sendShortlistInvite(
        to: string,
        candidateName: string,
        jobTitle: string,
    ): Promise<void> {
        await this.send({
            to,
            subject: `You've been shortlisted: ${jobTitle}`,
            html: shortlistInviteTemplate(candidateName, jobTitle),
        });
    }
}