const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const { JobDescription, Resume, SelfDescription, selfDescription } = require("./temp");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
});

// const invokeGeminiAi = async () => {

//     const response = await ai.models.generateContent({
//         model: "gemini-2.5-flash",
//         contents: "Hello gemini ! Explain what is interview ?"
//     });

//     console.log(response.text);

// }

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indication how well the candidate's profile matches the job description"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The techniacal question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc")
    })).describe("Technical question that can be asked int he interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The Behavioral question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc")
    })).describe("Behavioral question that can be asked int he interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidates is lackig"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap i.e. The severity of this skill gap i.e. how important it is to acquire or improve this skill")
    })).describe("List of skill gaps in the candidates profile along with thier severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparatin, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g Data Structures, System Design, Behavioral Interview, Aptitude, etc"),
        tasks: z.array(z.string()).describe("List of tasks to be completed on this day, such as studying concepts, solving coding problems, revising notes, or taking mock interviews")
    })).describe("A day-wise preparation plan for the candidate to follow in order to improve the skills required for the target job. Each day should have a clear focus area and a list of actionable tasks that progressively help the candidate become interview-ready"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

const generateInterviewReport = async ({ resume, selfDescription, jobDescription }) => {

    const prompt = `
        Generate an interview report for candidate with the following details:
            Resume: ${resume}
            Self Description: ${selfDescription}
            Job Description: ${jobDescription}
            `;

    const rawSchema = zodToJsonSchema(interviewReportSchema, {
        target: "openApi3",
        $refStrategy: "none", // forces inlining, no $ref/definitions
    });
    delete rawSchema.$schema; // Gemini rejects/ignores this meta key

    // console.log(JSON.stringify(rawSchema, null, 2));


    const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
        responseMimeType: "application/json",
        responseSchema: rawSchema,
    }
});

    return JSON.parse(response.text);

}

const generatePdfFormatHtml = async (htmlContent) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0"});

    const pdfBuffer = await  page.pdf({ format: "A4", margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm"
    }});

    await browser.close();

    return pdfBuffer;
}

const generateResumePdf = async ({ resume, jobDescription, selfDescription }) => {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to pdf using any library like puppeteer"),
    });

    const prompt = `Generate a resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevent experience. The HTML content should be well-formatted and structred, making it easy to read and visibly appealing
                        The content of resume should not sound like generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        the content should be ATS friendly, i.e. it should be easily parsable by ATS system without losing important information.
                        The resume should not be so lengthy, it should be ideally be 1-2 pages long when converted into PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidates's chances  of getting an interview call for the given job description.
                        `
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    });

    const jsonContent = JSON.parse(response.text);

    const pdfBuffer = await generatePdfFormatHtml(jsonContent.html);

    return pdfBuffer;
}

module.exports = {
    generateInterviewReport,
    generateResumePdf,
};