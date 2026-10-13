import { ai } from "../lib/ai.js"
import { parsedResumeResultSchema, type ParsedResumeResult, } from "../schemas/aiTask.schema.js"
import { prisma } from "../lib/prisma.js"

const resumeJsonSchema = {
    type: "object",
    properties: {
        skills: { type: "array", items: { type: "string" } },
        alignmentScore: { type: "integer" },
        skillGaps: { type: "array", items: { type: "string" } },
        summary: { type: "string" },
    },
    required: ["skills", "alignmentScore", "skillGaps", "summary"],
}

export class AIService {
    static async screenResume(resumeText: string, jobDescription: string): Promise<ParsedResumeResult> {
        const systemInstruction = `
            You are an AI resume screening engine for a hiring platform.
            Your job is to read the candidate resume and the job description and extract structured skill
            sets, calculate candidate-job alignment scores, and flag skill deficiencies.

            RULES:
            - skills: extract the candidate's key skills (strings).
            - alignmentScore: integer 0-100 estimating how well the candidate matches the job.
            - skillGaps: skills the job requires that the candidate lacks.
            - summary: one short paragraph summarizing the candidate's fit.

            OUTPUT:
            Return only pure JSON matching the requested schema. No markdown, no conversation.
            `

        const interaction = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: `JOB DESCRIPTION:\n${jobDescription}\n\nRESUME:\n${resumeText}`,
            config: {
                systemInstruction,
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: resumeJsonSchema,
            },
        })

        const rawJsonString = interaction.text
        if (!rawJsonString) {
            throw new Error("AI service returned an empty response.")
        }

        const unvalidatedJson = JSON.parse(rawJsonString)
        const validated = parsedResumeResultSchema.parse(unvalidatedJson)

        return validated
    }


    static async createAIEvaluation(applicationId: string, jobId: string, resumeText: string, jobDescription: string,): Promise<void> {
        const job = await prisma.job.findUnique({ where: { id: jobId } })
        if (!job) return
        try {
            const evaluation = await AIService.screenResume(resumeText, job.description)
            await prisma.aIEvaluation.create({
                data: {
                    applicationId,
                    jobId,
                    alignmentScore: evaluation.alignmentScore,
                    extractedSkills: evaluation.skills,
                    skillGaps: evaluation.skillGaps,
                    summary: evaluation.summary
                }
            })

            await prisma.application.update({
                where: { id: applicationId },
                data: { aiReviewStatus: "DONE" }
            })

        }

        catch (err) {

            console.error('AI screening error:', err)

            try {
                await prisma.application.update({
                    where: { id: applicationId },
                    data: { aiReviewStatus: "FAILED" },
                })
            }

            catch (updateErr) {
                console.error(`Error updating application:`, updateErr)
            }
        }
    }
}

