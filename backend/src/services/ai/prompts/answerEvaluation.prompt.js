/**
 * Candidate Answer Evaluation & Scoring Prompt & Zod Schema
 * 
 * Provides rigorous, constructive evaluation of a candidate's answer
 * against technical depth, completeness, communication clarity, and STAR structure.
 */

const { z } = require("zod");

const answerEvaluationSchema = z.object({
    score: z.number().min(1).max(10).describe("Overall score from 1 (poor/irrelevant) to 10 (exceptional)"),
    technicalAccuracy: z.number().min(0).max(100).describe("Technical correctness score from 0 to 100"),
    communication: z.number().min(0).max(100).describe("Clarity and articulation score from 0 to 100"),
    completeness: z.number().min(0).max(100).describe("How thoroughly all aspects of the question were answered (0 to 100)"),
    starStructure: z.number().min(0).max(100).describe("Evaluation of situation, task, action, result structure (0 to 100)"),
    strengths: z.array(z.string()).describe("Specific strong points demonstrated in the answer"),
    missingPoints: z.array(z.string()).describe("Key concepts, trade-offs, or details the candidate missed"),
    improvementSuggestions: z.array(z.string()).describe("Actionable advice on how to improve this answer"),
    betterAnswer: z.string().describe("Refined version demonstrating how to deliver an ideal response")
});

const buildAnswerEvaluationPrompt = ({
    questionText,
    intention = "",
    expectedTopics = [],
    modelAnswer = "",
    userAnswer
}) => {
    return `
You are a Principal Engineer and Hiring Committee Evaluator.
Evaluate the candidate's answer to the following interview question with objective, constructive feedback.

==================================================
INTERVIEW QUESTION:
==================================================
Question: ${questionText}
Interviewer Intention: ${intention || "Assess depth of understanding and practical problem-solving"}
Expected Concepts: ${expectedTopics.length > 0 ? expectedTopics.join(", ") : "Standard engineering best practices"}
Reference Model Answer: ${modelAnswer || "Not provided"}

==================================================
CANDIDATE'S SUBMITTED ANSWER:
==================================================
"${userAnswer}"

==================================================
EVALUATION RULES:
==================================================
1. If the candidate answered "I don't know", gibberish, or completely off-topic, assign a score between 1 and 2, do NOT fabricate strengths, and explain what the candidate should have answered.
2. If the answer is partially correct, assign score 4 to 6 and identify specifically what was missing.
3. If the answer is technically solid with good examples and trade-offs, assign 7 to 9.
4. Reserve 10 for answers that demonstrate deep architectural wisdom, trade-offs, and exceptional communication.
5. Provide actionable, supportive, and specific advice in improvementSuggestions.

Return ONLY a valid JSON object matching the requested schema.
`;
};

module.exports = {
    answerEvaluationSchema,
    buildAnswerEvaluationPrompt
};
