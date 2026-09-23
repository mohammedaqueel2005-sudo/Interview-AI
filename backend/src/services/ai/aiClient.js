/**
 * Centralized Gemini AI Client & Resilient Request Runner
 * 
 * Handles:
 * - Model configuration via process.env.GEMINI_MODEL (default: gemini-2.5-flash)
 * - Safe JSON parsing from markdown fences and noisy AI outputs
 * - Strict schema validation with Zod
 * - Exponential backoff retry for transient network and rate-limit (429, 503) errors
 */

const { GoogleGenAI } = require("@google/genai");

// Centralized default model name with environment override
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

let aiInstance = null;

/**
 * Returns the singleton GoogleGenAI client instance.
 */
const getAiClient = () => {
    if (!aiInstance) {
        const apiKey = process.env.GOOGLE_GENAI_API_KEY;
        if (!apiKey) {
            console.warn("GOOGLE_GENAI_API_KEY is not set in environment variables!");
        }
        aiInstance = new GoogleGenAI({ apiKey: apiKey || "" });
    }
    return aiInstance;
};

/**
 * Safely parses JSON from Gemini output.
 * Handles markdown code fences (```json ... ```), extra preamble, or postscript text.
 * 
 * @param {string} rawText - Raw text response from Gemini.
 * @returns {Object} Parsed JavaScript object.
 */
const parseGeminiResponse = (rawText) => {
    if (!rawText || typeof rawText !== "string") {
        throw new Error("Empty or non-string response received from AI service.");
    }

    let cleaned = rawText.trim();

    // 1. Remove markdown code blocks (e.g. ```json ... ``` or ``` ... ```)
    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }

    // 2. Direct JSON.parse attempt
    try {
        return JSON.parse(cleaned);
    } catch (directErr) {
        // 3. Fallback: locate innermost JSON object { ... } or array [ ... ]
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            const potentialJson = cleaned.substring(firstBrace, lastBrace + 1);
            try {
                return JSON.parse(potentialJson);
            } catch (innerErr) {
                // Keep moving to array check
            }
        }

        const firstBracket = cleaned.indexOf("[");
        const lastBracket = cleaned.lastIndexOf("]");
        if (firstBracket !== -1 && lastBracket > firstBracket) {
            const potentialArray = cleaned.substring(firstBracket, lastBracket + 1);
            try {
                return JSON.parse(potentialArray);
            } catch (innerArrErr) {
                // Both failed
            }
        }

        throw new Error(`Failed to parse AI JSON response: ${directErr.message}. Content was: ${cleaned.slice(0, 100)}...`);
    }
};

/**
 * Validates a parsed object against a Zod schema.
 * 
 * @param {Object} data - Parsed data to validate.
 * @param {import("zod").ZodSchema} schema - Zod schema.
 * @returns {Object} Validated and typed data.
 */
const validateGeminiResponse = (data, schema) => {
    if (!schema) return data;
    const result = schema.safeParse(data);
    if (!result.success) {
        const errorDetails = result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
        throw new Error(`AI response failed schema validation: ${errorDetails}`);
    }
    return result.data;
};

/**
 * Utility delay function for exponential backoff.
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calls Gemini with automatic exponential backoff retry for transient errors.
 * 
 * @param {Object} options
 * @param {string} options.prompt - Prompt text.
 * @param {Object} [options.config] - Additional Gemini config.
 * @param {import("zod").ZodSchema} [options.schema] - Optional Zod schema for structured output.
 * @param {string} [options.model] - Model name (defaults to GEMINI_MODEL env var).
 * @param {number} [options.maxRetries=3] - Maximum retry attempts.
 * @returns {Promise<Object|string>} Validated parsed JSON or raw string.
 */
const callGeminiWithRetry = async ({
    prompt,
    config = {},
    schema = null,
    model = DEFAULT_MODEL,
    maxRetries = 3
}) => {
    const ai = getAiClient();
    let attempt = 0;
    let baseDelay = 1000; // 1 second base delay

    while (attempt < maxRetries) {
        attempt++;
        try {
            const requestConfig = {
                ...config
            };

            // If a Zod schema is provided and no responseMimeType is configured, set JSON format
            if (schema && !requestConfig.responseMimeType) {
                requestConfig.responseMimeType = "application/json";
            }

            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: requestConfig
            });

            const text = response?.text || "";
            if (!text.trim()) {
                // Tag the error so the catch block treats it as retryable
                const emptyErr = new Error("model output must contain either output text or tool calls, these cannot both be empty");
                emptyErr.retryable = true;
                throw emptyErr;
            }

            // If schema is requested, parse and validate
            if (schema) {
                const parsed = parseGeminiResponse(text);
                const validated = validateGeminiResponse(parsed, schema);
                return validated;
            }

            return text;
        } catch (err) {
            const errMsg = err.message || "";

            const isRateLimit = err.status === 429 || errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED");
            const isServerTransient = (err.status >= 500 && err.status < 600) || errMsg.includes("503") || errMsg.includes("500");
            const isTimeout = err.code === "ETIMEDOUT" || errMsg.includes("timeout");

            // Empty output: model returned no text and no tool calls (safety filter or transient model issue)
            const isEmptyOutput = errMsg.includes("model output must contain either output text or tool calls") || errMsg.includes("empty response");

            // Model is overloaded / busy
            const isOverloaded = errMsg.toLowerCase().includes("overloaded") || errMsg.toLowerCase().includes("model is currently unavailable");

            const isRetryable = isRateLimit || isServerTransient || isTimeout || isEmptyOutput || isOverloaded;

            if (isRetryable && attempt < maxRetries) {
                const jitter = Math.random() * 500;
                // Overloaded model needs a longer pause before retry
                const overloadedExtraDelay = isOverloaded ? 5000 : 0;
                const delayMs = baseDelay * Math.pow(2, attempt - 1) + jitter + overloadedExtraDelay;
                const reason = isOverloaded ? "Model overloaded" : isEmptyOutput ? "Empty model output" : "Transient API error";
                console.warn(`[Gemini API] ${reason} (${errMsg.slice(0, 120)}). Attempt ${attempt}/${maxRetries}. Retrying in ${Math.round(delayMs)}ms...`);
                await sleep(delayMs);
            } else {
                // Non-retryable or max retries exhausted
                console.error(`[Gemini API] Call failed permanently on attempt ${attempt}:`, errMsg);
                throw err;
            }
        }
    }
};

module.exports = {
    getAiClient,
    DEFAULT_MODEL,
    parseGeminiResponse,
    validateGeminiResponse,
    callGeminiWithRetry
};
