/**
 * AI Service Adapter & Resume PDF Generator
 * 
 * Provides backwards compatibility for existing imports and implements
 * resilient, leak-free Puppeteer PDF generation with standard container flags.
 */

const puppeteer = require("puppeteer");
const { z } = require("zod");
const { callGeminiWithRetry, parseGeminiResponse } = require("./ai/aiClient");

const resumePdfSchema = z.object({
    html: z.string().min(100).describe("Complete HTML document for the resume")
});

/**
 * Renders HTML string to a PDF buffer using Puppeteer with safe resource cleanup.
 * 
 * @param {string} htmlContent - HTML string to render.
 * @returns {Promise<Buffer>} Generated PDF buffer.
 */
const generatePdfFormatHtml = async (htmlContent) => {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--no-first-run",
                "--no-zygote",
                "--disable-extensions",
                "--disable-background-networking"
            ]
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { 
            waitUntil: "domcontentloaded",
            timeout: 30000 
        });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "15mm",
                bottom: "15mm",
                left: "15mm",
                right: "15mm"
            }
        });

        return pdfBuffer;
    } catch (err) {
        console.error("Puppeteer PDF generation failed:", err.message);
        throw new Error(`Failed to generate PDF: ${err.message}`);
    } finally {
        if (browser) {
            try {
                await browser.close();
            } catch (closeErr) {
                console.error("Error closing Puppeteer browser:", closeErr.message);
            }
        }
    }
};

/**
 * Generates tailored ATS-friendly Resume PDF based on candidate profile and target JD.
 */
const generateResumePdf = async ({ resume = "", jobDescription = "", selfDescription = "" }) => {
    const prompt = `You are a professional resume writer. Generate a tailored, ATS-optimized resume in HTML format.

IMPORTANT: You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no explanation.

The JSON must have exactly this structure:
{"html": "<complete HTML document here>"}

The "html" value must be a complete, self-contained HTML document with embedded CSS that:
- Uses clean, professional typography (font-family: 'Segoe UI', Arial, sans-serif)
- Has proper A4 page layout with appropriate margins
- Includes sections: Contact Info, Professional Summary, Skills, Experience/Projects, Education
- Uses a modern, clean visual design with subtle color accents
- Is ATS-friendly with clear section headings
- Fits cleanly on 1-2 pages
- Emphasizes skills and experience relevant to the target role

Target Job Description:
${jobDescription ? jobDescription.substring(0, 2000) : "Not provided"}

Candidate Profile / Resume Content:
${resume ? resume.substring(0, 3000) : "Not provided"}

Candidate Self Description:
${selfDescription ? selfDescription.substring(0, 1000) : "Not provided"}

Remember: Respond ONLY with the JSON object {"html": "..."}. Do not include any other text.`;

    console.log(`[Resume PDF] Generating tailored resume HTML via Gemini...`);

    const result = await callGeminiWithRetry({
        prompt,
        schema: resumePdfSchema,
        maxRetries: 3
    });

    if (!result || !result.html) {
        throw new Error("AI failed to generate valid resume HTML. Please try again.");
    }

    console.log(`[Resume PDF] HTML generated (${result.html.length} chars). Converting to PDF...`);
    const pdfBuffer = await generatePdfFormatHtml(result.html);
    console.log(`[Resume PDF] PDF generated successfully (${pdfBuffer.length} bytes).`);
    return pdfBuffer;
};

module.exports = {
    generatePdfFormatHtml,
    generateResumePdf
};