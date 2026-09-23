/**
 * Interview Preparation Pipeline Orchestration Service
 * 
 * Implements the reliable, structured, explainable pipeline:
 * RESUME/SELF-DESC 
 *   → STRUCTURED RESUME EXTRACTION 
 *   → SKILL NORMALIZATION 
 *   → JD REQUIREMENT EXTRACTION 
 *   → DETERMINISTIC SKILL COMPARISON 
 *   → IDENTIFY SKILL GAPS 
 *   → GEMINI PERSONALIZED PREPARATION 
 *   → QUESTIONS + ROADMAP + EXPLAINABILITY 
 *   → STORE USER HISTORY
 */

const interviewReportModel = require("../models/interviewReport.model");
const { parseResumeFile } = require("./resumeParser.service");
const { compareSkills } = require("./comparison.service");
const { callGeminiWithRetry } = require("./ai/aiClient");
const { structuredResumeSchema, buildResumeExtractionPrompt } = require("./ai/prompts/resumeExtraction.prompt");
const { structuredJdSchema, buildJdExtractionPrompt } = require("./ai/prompts/jdExtraction.prompt");
const { preparationOutputSchema, buildPreparationPrompt } = require("./ai/prompts/preparation.prompt");

/**
 * Executes the complete interview preparation generation pipeline.
 * 
 * @param {Object} params
 * @param {string} params.userId - Authenticated user ID.
 * @param {string} params.jobDescription - Raw target job description.
 * @param {string} [params.selfDescription] - Optional candidate self description.
 * @param {Object} [params.resumeFile] - Optional uploaded multer file.
 * 
 * @returns {Promise<Object>} Created interview report document.
 */
const generateInterviewPipeline = async ({
    userId,
    jobDescription,
    selfDescription = "",
    resumeFile = null
}) => {
    // 1. Input Validation
    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 20) {
        const error = new Error("Please provide a detailed job description (minimum 20 characters).");
        error.status = 400;
        error.code = "INVALID_JOB_DESCRIPTION";
        throw error;
    }

    // 2. Safe Resume File Extraction
    let resumeText = "";
    if (resumeFile) {
        const parseResult = await parseResumeFile(resumeFile);
        if (!parseResult.success && (!selfDescription || !selfDescription.trim())) {
            const error = new Error(parseResult.error || "Failed to extract text from the uploaded resume.");
            error.status = 400;
            error.code = "RESUME_PARSE_FAILED";
            throw error;
        }
        resumeText = parseResult.text || "";
    }

    const trimmedSelfDesc = (selfDescription || "").trim();

    if (!resumeText && !trimmedSelfDesc) {
        const error = new Error("Please provide either a Resume PDF or a Self Description so we can tailor the plan.");
        error.status = 400;
        error.code = "MISSING_PROFILE_DATA";
        throw error;
    }

    // 3. Structured Candidate Profile Extraction via AI
    const resumePrompt = buildResumeExtractionPrompt({
        resumeText,
        selfDescription: trimmedSelfDesc
    });

    const structuredResume = await callGeminiWithRetry({
        prompt: resumePrompt,
        schema: structuredResumeSchema
    });

    console.log(`[PIPELINE DEBUG] 1. Raw extracted resume text length: ${resumeText.length} chars, selfDescription: ${trimmedSelfDesc.length} chars`);
    console.log(`[PIPELINE DEBUG] 2. Structured resume extraction:`, {
        skillsCount: (structuredResume.skills || []).length,
        languagesCount: (structuredResume.programmingLanguages || []).length,
        projectsCount: (structuredResume.projects || []).length
    });

    // 4. Structured Job Description Requirements Extraction via AI
    const jdPrompt = buildJdExtractionPrompt({
        jobDescription: jobDescription.trim()
    });

    const structuredJd = await callGeminiWithRetry({
        prompt: jdPrompt,
        schema: structuredJdSchema
    });

    console.log(`[PIPELINE DEBUG] 5. Raw JD extraction result:`, {
        jobTitle: structuredJd.jobTitle,
        requiredSkillsCount: (structuredJd.requiredSkills || []).length,
        preferredSkillsCount: (structuredJd.preferredSkills || []).length,
        allSkillsCount: (structuredJd.allSkills || []).length
    });

    // 5. Deterministic Skill Extraction & Normalization
    // Gather all candidate skills from structured resume
    const candidateSkills = Array.from(new Set([
        ...(structuredResume.allSkills || []),
        ...(structuredResume.skills || []),
        ...(structuredResume.programmingLanguages || []),
        ...(structuredResume.frameworks || []),
        ...(structuredResume.libraries || []),
        ...(structuredResume.databases || []),
        ...(structuredResume.cloud || []),
        ...(structuredResume.devops || []),
        ...(structuredResume.tools || [])
    ]));

    console.log(`[PIPELINE DEBUG] 3. Resume skills before normalization:`, candidateSkills);
    const { normalizeSkills } = require("./skill.service");
    const normResumeSkills = normalizeSkills(candidateSkills);
    console.log(`[PIPELINE DEBUG] 4. Resume skills after normalization:`, normResumeSkills);

    console.log(`[PIPELINE DEBUG] 6. JD requirements before normalization:`, {
        required: structuredJd.requiredSkills || [],
        preferred: structuredJd.preferredSkills || []
    });
    const normJdRequired = normalizeSkills([
        ...(structuredJd.requiredSkills || []),
        ...(structuredJd.programmingLanguages || []),
        ...(structuredJd.frameworks || []),
        ...(structuredJd.databases || [])
    ]);
    console.log(`[PIPELINE DEBUG] 7. JD requirements after normalization:`, normJdRequired);

    // 6. Deterministic Skill Comparison & Gap Classification
    // NOTE: Match score and gaps are calculated purely in application code, NOT by Gemini!
    const comparisonResult = compareSkills({
        candidateSkills,
        jdRequirements: structuredJd
    });

    console.log(`[PIPELINE DEBUG] 8. Deterministic comparison result:`, {
        requiredSkillCount: comparisonResult.requiredSkillCount,
        matchedSkillCount: comparisonResult.matchedSkillCount,
        matchPercentage: comparisonResult.matchPercentage,
        matchedSkills: comparisonResult.matchedSkills,
        missingSkills: comparisonResult.missingSkills,
        gapsCount: (comparisonResult.gaps || []).length,
        status: comparisonResult.skillsAnalysis.status
    });

    // 7. Grounded Personalized Preparation Generation via AI
    // Gemini receives verified facts and deterministic gaps with strict anti-hallucination rules
    const prepPrompt = buildPreparationPrompt({
        candidateProfile: structuredResume,
        jdRequirements: structuredJd,
        matchedSkills: comparisonResult.matchedSkills,
        missingSkills: comparisonResult.missingSkills,
        gaps: comparisonResult.gaps
    });

    console.log(`[PIPELINE DEBUG] 9. Gemini roadmap input:`, {
        candidateSkillsCount: normResumeSkills.length,
        jdRequiredSkillsCount: normJdRequired.length,
        missingSkillsCount: comparisonResult.missingSkills.length,
        gapsCount: comparisonResult.gaps.length
    });

    const prepResult = await callGeminiWithRetry({
        prompt: prepPrompt,
        schema: preparationOutputSchema
    });

    console.log(`[PIPELINE DEBUG] 10. Gemini roadmap output:`, {
        daysCount: (prepResult.roadmap || []).length,
        techQuestionsCount: (prepResult.technicalQuestions || []).length,
        behavioralQuestionsCount: (prepResult.behavioralQuestions || []).length
    });

    // 8. Transform preparation roadmap into schema format
    const formattedRoadmap = (prepResult.roadmap || []).map(dayItem => ({
        day: dayItem.day,
        focus: dayItem.focus,
        priority: dayItem.priority || "important",
        reason: dayItem.reason || "",
        tasks: dayItem.tasks || [],
        completed: false
    }));

    // 9. Persist Report in MongoDB
    const reportData = {
        user: userId,
        title: structuredJd.jobTitle || "Target Role",
        jobDescription: jobDescription.trim(),
        resume: resumeText,
        selfDescription: trimmedSelfDesc,
        structuredResume,
        structuredJd,
        skillAnalysis: comparisonResult.skillsAnalysis,
        skillsAnalysis: comparisonResult.skillsAnalysis,
        matchScore: comparisonResult.matchPercentage !== null ? comparisonResult.matchPercentage : 0, // Deterministic score!
        technicalQuestions: prepResult.technicalQuestions,
        behavioralQuestions: prepResult.behavioralQuestions,
        skillGaps: comparisonResult.gaps, // Deterministic gaps with explainability
        preparationPlan: formattedRoadmap,
        roadmap: formattedRoadmap,
        verifiedStrengths: comparisonResult.skillsAnalysis.verifiedStrengths || [],
        assessments: []
    };

    console.log(`[PIPELINE DEBUG] 11. Final interview report object before database save:`, {
        title: reportData.title,
        matchScore: reportData.matchScore,
        skillAnalysisScore: reportData.skillsAnalysis?.matchPercentage,
        matchedCount: reportData.skillsAnalysis?.matchedSkillCount,
        requiredCount: reportData.skillsAnalysis?.requiredSkillCount,
        gapsCount: reportData.skillGaps?.length,
        roadmapDaysCount: reportData.roadmap?.length
    });

    const interviewReport = await interviewReportModel.create(reportData);

    console.log(`[PIPELINE DEBUG] 12. Final API response report ID: ${interviewReport._id}`);

    return interviewReport;
};

/**
 * Retrieves a single interview report by ID ensuring user authorization.
 */
const getInterviewReportById = async (interviewId, userId) => {
    const report = await interviewReportModel.findOne({ _id: interviewId, user: userId }).lean();
    if (!report) {
        const error = new Error("Interview report not found.");
        error.status = 404;
        error.code = "REPORT_NOT_FOUND";
        throw error;
    }

    // Ensure backwards and forwards compatibility between naming variants
    if (!report.roadmap && report.preparationPlan) {
        report.roadmap = report.preparationPlan;
    }
    if (!report.preparationPlan && report.roadmap) {
        report.preparationPlan = report.roadmap;
    }
    if (!report.skillsAnalysis && report.skillAnalysis) {
        report.skillsAnalysis = report.skillAnalysis;
    }
    if (!report.skillAnalysis && report.skillsAnalysis) {
        report.skillAnalysis = report.skillsAnalysis;
    }

    // --- Backward-Compatibility Recomputation for Legacy/Broken Reports ---
    // If this report was saved with empty skillsAnalysis (requiredSkillCount === 0)
    // but has stored structuredJd/structuredResume, or raw jobDescription text, recompute on the fly.
    const analysis = report.skillsAnalysis || report.skillAnalysis || {};
    const hasEmptyAnalysis = !analysis.requiredSkillCount || analysis.requiredSkillCount === 0;
    const hasStoredData = report.structuredJd && report.structuredResume;

    if (hasEmptyAnalysis && hasStoredData) {
        console.log(`[COMPAT] Recomputing skill analysis for legacy report ${interviewId}`);
        try {
            const { compareSkills } = require("./comparison.service");

            let structuredResume = report.structuredResume;
            let structuredJd = report.structuredJd;

            // Gather all candidate skills exactly as the pipeline does
            const candidateSkills = Array.from(new Set([
                ...(structuredResume.allSkills || []),
                ...(structuredResume.skills || []),
                ...(structuredResume.programmingLanguages || []),
                ...(structuredResume.frameworks || []),
                ...(structuredResume.libraries || []),
                ...(structuredResume.databases || []),
                ...(structuredResume.cloud || []),
                ...(structuredResume.devops || []),
                ...(structuredResume.tools || [])
            ]));

            // Check if structuredJd has any usable skills
            const jdHasSkills =
                (structuredJd.requiredSkills && structuredJd.requiredSkills.length > 0) ||
                (structuredJd.preferredSkills && structuredJd.preferredSkills.length > 0) ||
                (structuredJd.programmingLanguages && structuredJd.programmingLanguages.length > 0) ||
                (structuredJd.frameworks && structuredJd.frameworks.length > 0);

            // If the stored structuredJd is empty but we have raw jobDescription text,
            // re-run the JD extraction via Gemini to get the skills
            if (!jdHasSkills && report.jobDescription && report.jobDescription.trim().length > 20) {
                console.log(`[COMPAT] structuredJd has no skills. Re-extracting from raw jobDescription text...`);
                try {
                    const { buildJdExtractionPrompt, structuredJdSchema } = require("./ai/prompts/jdExtraction.prompt");
                    const jdPrompt = buildJdExtractionPrompt({ jobDescription: report.jobDescription.trim() });
                    structuredJd = await callGeminiWithRetry({
                        prompt: jdPrompt,
                        schema: structuredJdSchema
                    });
                    console.log(`[COMPAT] Re-extracted JD: requiredSkills=${structuredJd.requiredSkills.length}`);
                } catch (jdReExtractErr) {
                    console.warn(`[COMPAT] JD re-extraction failed: ${jdReExtractErr.message}`);
                }
            }

            // Now check again if we have usable skills after possible re-extraction
            const jdHasSkillsNow =
                (structuredJd.requiredSkills && structuredJd.requiredSkills.length > 0) ||
                (structuredJd.preferredSkills && structuredJd.preferredSkills.length > 0) ||
                (structuredJd.programmingLanguages && structuredJd.programmingLanguages.length > 0) ||
                (structuredJd.frameworks && structuredJd.frameworks.length > 0);

            if (jdHasSkillsNow && candidateSkills.length > 0) {
                const comparisonResult = compareSkills({
                    candidateSkills,
                    jdRequirements: structuredJd
                });

                // Patch the in-memory report object (NOT saved back to DB — read-only fix)
                report.skillAnalysis = comparisonResult.skillsAnalysis;
                report.skillsAnalysis = comparisonResult.skillsAnalysis;
                report.verifiedStrengths = comparisonResult.verifiedStrengths;
                report.matchScore = comparisonResult.matchPercentage !== null ? comparisonResult.matchPercentage : report.matchScore;

                // Only override skillGaps if the stored one is empty
                if (!report.skillGaps || report.skillGaps.length === 0) {
                    report.skillGaps = comparisonResult.gaps;
                }

                console.log(`[COMPAT] Recomputed: matchScore=${report.matchScore}, matched=${comparisonResult.matchedSkillCount}/${comparisonResult.requiredSkillCount}, gaps=${comparisonResult.gaps.length}`);
            }
        } catch (recomputeErr) {
            // Don't crash the request if recomputation fails
            console.warn(`[COMPAT] Failed to recompute skill analysis for ${interviewId}:`, recomputeErr.message);
        }
    }

    return report;
};


/**
 * Retrieves all interview reports for the authenticated user (lean summary).
 */
const getAllInterviewReports = async (userId) => {
    return await interviewReportModel
        .find({ user: userId })
        .sort({ createdAt: -1 })
        .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -preparationPlan -assessments");
};

module.exports = {
    generateInterviewPipeline,
    getInterviewReportById,
    getAllInterviewReports
};
