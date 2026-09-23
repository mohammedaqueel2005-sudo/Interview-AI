/**
 * Unit Tests for AI Response Validation & Safe Parsing
 * Run with: node --test backend/tests/aiValidation.test.js
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { z } = require("zod");
const { parseGeminiResponse, validateGeminiResponse } = require("../src/services/ai/aiClient");

describe("AI Response Parsing & Validation Service", () => {

    it("should safely parse raw clean JSON", () => {
        const raw = '{"name": "Alice", "skills": ["react", "node.js"]}';
        const parsed = parseGeminiResponse(raw);
        assert.deepEqual(parsed, { name: "Alice", skills: ["react", "node.js"] });
    });

    it("should strip markdown code fences (```json ... ```)", () => {
        const raw = "```json\n{\n  \"status\": \"success\",\n  \"score\": 85\n}\n```";
        const parsed = parseGeminiResponse(raw);
        assert.deepEqual(parsed, { status: "success", score: 85 });
    });

    it("should strip unlabelled markdown code fences (``` ... ```)", () => {
        const raw = "```\n{\n  \"title\": \"Senior Engineer\"\n}\n```";
        const parsed = parseGeminiResponse(raw);
        assert.deepEqual(parsed, { title: "Senior Engineer" });
    });

    it("should extract JSON even with conversational preamble and postscript", () => {
        const raw = `
        Certainly! Here is the structured JSON representation of the job description:
        {
            "jobTitle": "Full Stack Developer",
            "requiredSkills": ["TypeScript", "Next.js"]
        }
        Let me know if you need anything else!
        `;
        const parsed = parseGeminiResponse(raw);
        assert.equal(parsed.jobTitle, "Full Stack Developer");
        assert.deepEqual(parsed.requiredSkills, ["TypeScript", "Next.js"]);
    });

    it("should throw a clear error when given completely invalid non-JSON", () => {
        const raw = "I am sorry, but I cannot process this document.";
        assert.throws(() => {
            parseGeminiResponse(raw);
        }, /Failed to parse AI JSON response/);
    });

    it("should validate valid data against a Zod schema", () => {
        const testSchema = z.object({
            score: z.number().min(0).max(100),
            name: z.string()
        });

        const data = { score: 92, name: "Candidate A" };
        const validated = validateGeminiResponse(data, testSchema);
        assert.deepEqual(validated, data);
    });

    it("should reject invalid data when types or constraints fail", () => {
        const testSchema = z.object({
            score: z.number().min(0).max(100),
            name: z.string()
        });

        const invalidData = { score: 150, name: "Candidate B" }; // score > 100
        assert.throws(() => {
            validateGeminiResponse(invalidData, testSchema);
        }, /AI response failed schema validation/);
    });

});
