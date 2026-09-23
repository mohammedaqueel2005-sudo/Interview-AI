/**
 * Deterministic Skill Comparison & Gap Classification Service
 * 
 * CRITICAL ARCHITECTURAL RULE:
 * This service runs purely in deterministic JavaScript code.
 * Gemini / LLMs MUST NOT decide whether a skill is present or calculate the match percentage.
 */

const { normalizeSkill, normalizeSkills, categorizeSkill } = require("./skill.service");

/**
 * Deterministically compares candidate skills with job description requirements.
 * 
 * @param {Object} params
 * @param {string[]} params.candidateSkills - Array of extracted candidate skills.
 * @param {Object} params.jdRequirements - Structured JD requirements object.
 * 
 * @returns {Object} Deterministic comparison result, single skillsAnalysis object, and categorized gaps.
 */
const compareSkills = ({ candidateSkills = [], jdRequirements = {} }) => {
    // 1. Normalize candidate skills into a Set for O(1) lookup
    const normCandidateSkills = normalizeSkills(candidateSkills);
    const candidateSet = new Set(normCandidateSkills);

    // 2. Aggregate and normalize JD required skills
    const rawRequired = [
        ...(jdRequirements.requiredSkills || []),
        ...(jdRequirements.programmingLanguages || []),
        ...(jdRequirements.frameworks || []),
        ...(jdRequirements.databases || [])
    ];
    const normRequiredSkills = normalizeSkills(rawRequired);

    // 3. Aggregate and normalize JD preferred / secondary skills
    const rawPreferred = [
        ...(jdRequirements.preferredSkills || []),
        ...(jdRequirements.cloud || []),
        ...(jdRequirements.devops || []),
        ...(jdRequirements.tools || []),
        ...(jdRequirements.softSkills || [])
    ];
    // Exclude any skills already in required list
    const requiredSet = new Set(normRequiredSkills);
    const normPreferredSkills = normalizeSkills(rawPreferred).filter(s => !requiredSet.has(s));

    // 4. Deterministic Matching
    const matchedRequired = [];
    const missingRequired = [];

    for (const skill of normRequiredSkills) {
        if (candidateSet.has(skill)) {
            matchedRequired.push(skill);
        } else {
            missingRequired.push(skill);
        }
    }

    const matchedPreferred = [];
    const missingPreferred = [];

    for (const skill of normPreferredSkills) {
        if (candidateSet.has(skill)) {
            matchedPreferred.push(skill);
        } else {
            missingPreferred.push(skill);
        }
    }

    const allMatched = [...new Set([...matchedRequired, ...matchedPreferred])];
    const allMissing = [...new Set([...missingRequired, ...missingPreferred])];

    // Additional candidate skills not mentioned in JD
    const jdAllSkillsSet = new Set([...normRequiredSkills, ...normPreferredSkills]);
    const additionalSkills = normCandidateSkills.filter(s => !jdAllSkillsSet.has(s));

    // Verified strengths: strictly candidate skills ∩ required JD skills
    const verifiedStrengths = [...matchedRequired];

    // 5. Deterministic Match Percentage Calculation
    const requiredCount = normRequiredSkills.length;
    const matchedRequiredCount = matchedRequired.length;

    let matchPercentage = null;
    let analysisStatus = "success";

    if (requiredCount > 0) {
        matchPercentage = Number(((matchedRequiredCount / requiredCount) * 100).toFixed(2));
        analysisStatus = "success";
    } else if (normPreferredSkills.length > 0) {
        matchPercentage = Number(((matchedPreferred.length / normPreferredSkills.length) * 100).toFixed(2));
        analysisStatus = "success";
    } else {
        // Zero JD requirements extracted: do NOT return 50%! Return null and insufficient_data
        matchPercentage = null;
        analysisStatus = "insufficient_data";
    }

    // 6. Gap Classification with Explainability
    // CRITICAL (high): Missing core required languages, frameworks, databases
    // IMPORTANT (medium): Other missing required skills/tools
    // OPTIONAL (low): Missing preferred / nice-to-have skills
    const gaps = [];

    for (const skill of missingRequired) {
        const category = categorizeSkill(skill);
        const isCoreDomain = ["language", "framework", "database"].includes(category);
        
        gaps.push({
            skill,
            severity: isCoreDomain ? "high" : "medium",
            category: category.charAt(0).toUpperCase() + category.slice(1),
            reason: isCoreDomain 
                ? `Core ${category} required by the job description but not identified in your profile.`
                : `Required by the job description but not identified in the candidate profile.`
        });
    }

    for (const skill of missingPreferred) {
        const category = categorizeSkill(skill);
        gaps.push({
            skill,
            severity: "low",
            category: category.charAt(0).toUpperCase() + category.slice(1),
            reason: `Preferred / bonus skill mentioned in the job description.`
        });
    }

    // Sort gaps: high severity first, then medium, then low
    const severityOrder = { high: 0, medium: 1, low: 2 };
    gaps.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    const skillsAnalysis = {
        candidateSkills: normCandidateSkills,
        requiredSkills: normRequiredSkills,
        preferredSkills: normPreferredSkills,
        matchedSkills: allMatched,
        missingSkills: allMissing,
        missingRequiredSkills: missingRequired,
        missingPreferredSkills: missingPreferred,
        additionalSkills,
        verifiedStrengths,
        requiredSkillCount: requiredCount,
        matchedSkillCount: matchedRequiredCount,
        matchPercentage,
        status: analysisStatus
    };

    return {
        skillsAnalysis,
        // Also expose top-level fields for backwards compatibility
        matchedSkills: allMatched,
        missingSkills: allMissing,
        missingRequiredSkills: missingRequired,
        missingPreferredSkills: missingPreferred,
        additionalSkills,
        verifiedStrengths,
        requiredSkillCount: requiredCount,
        matchedSkillCount: matchedRequiredCount,
        matchPercentage,
        status: analysisStatus,
        gaps
    };
};

module.exports = {
    compareSkills
};
