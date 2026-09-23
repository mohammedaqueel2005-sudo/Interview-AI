/**
 * Assessment Service
 * 
 * Handles AI-powered evaluation of candidate answers to interview questions.
 * Validates scores and saves evaluation history to MongoDB.
 */

const interviewReportModel = require("../models/interviewReport.model");
const { callGeminiWithRetry } = require("./ai/aiClient");
const { answerEvaluationSchema, buildAnswerEvaluationPrompt } = require("./ai/prompts/answerEvaluation.prompt");

/**
 * Evaluates a candidate's answer to an interview question and persists the assessment.
 * 
 * @param {Object} params
 * @param {string} params.interviewId - MongoDB ID of the interview report.
 * @param {string} params.userId - ID of the authenticated user.
 * @param {number} [params.questionIndex] - 0-indexed position of question.
 * @param {string} params.questionText - Text of the question.
 * @param {string} params.userAnswer - The candidate's response.
 * @param {string} [params.questionType="technical"] - 'technical' or 'behavioral'
 * 
 * @returns {Promise<Object>} Evaluated assessment object.
 */
const evaluateCandidateAnswer = async ({
    interviewId,
    userId,
    questionIndex = 0,
    questionText,
    userAnswer,
    questionType = "technical"
}) => {
    if (!userAnswer || !userAnswer.trim()) {
        const error = new Error("Please provide an answer to evaluate.");
        error.status = 400;
        error.code = "EMPTY_ANSWER";
        throw error;
    }

    if (!questionText || !questionText.trim()) {
        const error = new Error("Question text is required.");
        error.status = 400;
        error.code = "INVALID_QUESTION";
        throw error;
    }

    // Find the parent interview report
    const report = await interviewReportModel.findOne({ _id: interviewId, user: userId });
    if (!report) {
        const error = new Error("Interview report not found or unauthorized.");
        error.status = 404;
        error.code = "REPORT_NOT_FOUND";
        throw error;
    }

    // Retrieve question context if available
    let intention = "";
    let expectedTopics = [];
    let modelAnswer = "";

    const questionList = questionType === "behavioral" 
        ? report.behavioralQuestions 
        : report.technicalQuestions;

    if (Array.isArray(questionList) && questionList[questionIndex]) {
        const targetQ = questionList[questionIndex];
        intention = targetQ.intention || "";
        expectedTopics = targetQ.expectedTopics || [];
        modelAnswer = targetQ.answer || "";
    }

    // Build prompt and execute Gemini evaluation with retry & Zod schema validation
    const prompt = buildAnswerEvaluationPrompt({
        questionText,
        intention,
        expectedTopics,
        modelAnswer,
        userAnswer: userAnswer.trim()
    });

    const evaluation = await callGeminiWithRetry({
        prompt,
        schema: answerEvaluationSchema
    });

    // Create assessment record
    const assessmentRecord = {
        questionIndex,
        questionText,
        userAnswer: userAnswer.trim(),
        score: evaluation.score,
        technicalAccuracy: evaluation.technicalAccuracy,
        communication: evaluation.communication,
        completeness: evaluation.completeness,
        starStructure: evaluation.starStructure,
        strengths: evaluation.strengths,
        missingPoints: evaluation.missingPoints,
        improvementSuggestions: evaluation.improvementSuggestions,
        betterAnswer: evaluation.betterAnswer,
        createdAt: new Date()
    };

    // Append to report assessments and save
    if (!Array.isArray(report.assessments)) {
        report.assessments = [];
    }
    report.assessments.push(assessmentRecord);
    await report.save();

    return assessmentRecord;
};

module.exports = {
    evaluateCandidateAnswer
};
