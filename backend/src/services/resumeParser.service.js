/**
 * Defensive Resume Parser Service
 * 
 * Safely extracts text from uploaded PDF files.
 * Handles missing files, empty buffers, corrupted files, and format errors without crashing.
 */

const MAX_RESUME_TEXT_LENGTH = 50000; // Limit to 50,000 characters to prevent prompt overflow

/**
 * Safely extracts text from an uploaded file buffer.
 * 
 * @param {Object} file - Multer file object (or undefined/null)
 * @returns {Promise<{ success: boolean, text: string, error?: string }>}
 */
const parseResumeFile = async (file) => {
    // 1. Handle no file uploaded gracefully
    if (!file || !file.buffer) {
        return { success: true, text: "", source: "none" };
    }

    // 2. Validate buffer size
    if (file.buffer.length === 0) {
        return { success: true, text: "", source: "empty" };
    }

    try {
        const pdfParse = require("pdf-parse");
        let extractedText = "";

        // Support pdf-parse v2 class style
        if (typeof pdfParse.PDFParse === "function") {
            const parserInstance = new pdfParse.PDFParse(Uint8Array.from(file.buffer));
            const result = await parserInstance.getText();
            extractedText = typeof result === "string" ? result : (result?.text || "");
        } else if (typeof pdfParse === "function") {
            // Support traditional function style
            const result = await pdfParse(file.buffer);
            extractedText = typeof result === "string" ? result : (result?.text || "");
        } else {
            // Fallback: convert buffer to plain text
            extractedText = file.buffer.toString("utf8");
        }

        // Clean and sanitize text
        let sanitizedText = (extractedText || "")
            .replace(/\r\n/g, "\n")
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove non-printable control characters
            .trim();

        // Enforce safety length cap
        if (sanitizedText.length > MAX_RESUME_TEXT_LENGTH) {
            sanitizedText = sanitizedText.substring(0, MAX_RESUME_TEXT_LENGTH) + "\n...[Content truncated for length]";
        }

        return {
            success: true,
            text: sanitizedText,
            source: "pdf"
        };
    } catch (err) {
        console.error("Resume PDF parsing failed:", err.message);
        // Do not crash the server on corrupt PDFs! Return controlled failure info.
        return {
            success: false,
            text: "",
            error: "Failed to extract text from the uploaded PDF. It may be corrupted or password-protected.",
            code: "RESUME_PARSE_FAILED"
        };
    }
};

module.exports = {
    parseResumeFile,
    MAX_RESUME_TEXT_LENGTH
};
