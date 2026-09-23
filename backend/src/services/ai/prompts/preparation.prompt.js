/**
 * Personalized Interview Preparation Prompt & Resilient Zod Schema
 * 
 * Generates technical questions, behavioral questions, explainability metadata,
 * and a tailored preparation roadmap grounded strictly in verified candidate data
 * and deterministic skill gap analysis.
 */

const { z } = require("zod");

/**
 * Coerces various task representations (string, array of strings, array of objects) into string[]
 */
const toStringArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) {
        return val.flatMap(item => {
            if (typeof item === "string") return [item.trim()];
            if (typeof item === "object" && item !== null) {
                return [item.task || item.activity || item.description || JSON.stringify(item)];
            }
            return [String(item)];
        }).filter(Boolean);
    }
    if (typeof val === "string") {
        return val.split("\n").map(s => s.replace(/^[-*•\d.]+\s*/, "").trim()).filter(Boolean);
    }
    return [];
};

/**
 * Normalizes roadmap days from arrays, { daily_plan: [...] }, or { days: [...] }
 */
const transformRoadmap = (val) => {
    let rawList = [];
    if (Array.isArray(val)) {
        rawList = val;
    } else if (val && typeof val === "object") {
        if (Array.isArray(val.daily_plan)) rawList = val.daily_plan;
        else if (Array.isArray(val.days)) rawList = val.days;
        else if (Array.isArray(val.plan)) rawList = val.plan;
        else if (Array.isArray(val.roadmap)) rawList = val.roadmap;
        else if (Array.isArray(val.schedule)) rawList = val.schedule;
    }

    if (!rawList || rawList.length === 0) return [];

    return rawList.map((dayItem, idx) => {
        const dayNumber = typeof dayItem.day === "number" ? dayItem.day : (idx + 1);
        const focus = dayItem.focus || dayItem.topic || dayItem.title || `Day ${dayNumber} Preparation`;
        
        let priority = "important";
        const rawPriority = (dayItem.priority || "").toLowerCase();
        if (["critical", "high"].includes(rawPriority)) priority = "critical";
        else if (["optional", "low"].includes(rawPriority)) priority = "optional";
        else priority = "important";

        const reason = dayItem.reason || dayItem.whyNeeded || dayItem.description || `Targeted preparation for ${focus}`;
        const tasks = toStringArray(dayItem.tasks || dayItem.activities || dayItem.items || dayItem.actionItems);

        return {
            day: dayNumber,
            focus,
            priority,
            reason,
            tasks: tasks.length > 0 ? tasks : [`Review core concepts and practice implementation for ${focus}`],
            completed: false
        };
    });
};

const rawPrepSchema = z.object({
    technicalQuestions: z.any().optional(),
    behavioralQuestions: z.any().optional(),
    roadmap: z.any().optional(),
    studyRecommendations: z.any().optional(),
    // Also handle possible alternate root wrappers
    personalized_preparation_package: z.any().optional(),
    technical_questions: z.any().optional(),
    behavioral_questions: z.any().optional(),
    preparation_roadmap: z.any().optional(),
    preparationPlan: z.any().optional()
}).passthrough();

const preparationOutputSchema = rawPrepSchema.transform((raw) => {
    const pkg = raw.personalized_preparation_package || raw;

    // 1. Technical Questions
    const rawTech = pkg.technicalQuestions || pkg.technical_questions || [];
    const technicalQuestions = (Array.isArray(rawTech) ? rawTech : []).map(q => ({
        question: q.question || q.title || "",
        skill: q.skill || q.technology || "",
        difficulty: ["easy", "medium", "hard"].includes(q.difficulty?.toLowerCase()) ? q.difficulty.toLowerCase() : "medium",
        category: q.category || "General",
        source: ["resume", "jd", "gap", "project"].includes(q.source?.toLowerCase()) ? q.source.toLowerCase() : "jd",
        reason: q.reason || q.rationale || "Relevant to job requirements",
        intention: q.intention || q.interviewerIntention || "Assess candidate technical capability",
        answer: q.answer || q.sampleAnswer || q.modelAnswer || "",
        expectedTopics: toStringArray(q.expectedTopics || q.keyConcepts || q.expected_topics),
        followUpQuestions: toStringArray(q.followUpQuestions || q.follow_up_questions)
    })).filter(q => q.question.trim().length > 0);

    // 2. Behavioral Questions
    const rawBeh = pkg.behavioralQuestions || pkg.behavioral_questions || [];
    const behavioralQuestions = (Array.isArray(rawBeh) ? rawBeh : []).map(q => ({
        question: q.question || "",
        category: q.category || "General",
        source: ["behavioral", "resume", "jd"].includes(q.source?.toLowerCase()) ? q.source.toLowerCase() : "behavioral",
        reason: q.reason || "Evaluates cultural and situational fit",
        intention: q.intention || "Assess behavioral competency",
        answer: q.answer || q.sampleAnswer || q.modelAnswer || "",
        starTips: toStringArray(q.starTips || q.star_tips || q.tips)
    })).filter(q => q.question.trim().length > 0);

    // 3. Roadmap
    const rawRoadmap = pkg.roadmap || pkg.preparation_roadmap || pkg.preparationPlan || pkg.daily_plan || raw.roadmap;
    const roadmap = transformRoadmap(rawRoadmap);

    return {
        technicalQuestions,
        behavioralQuestions,
        roadmap,
        studyRecommendations: pkg.studyRecommendations || pkg.targeted_study_recommendations || []
    };
});

const buildPreparationPrompt = ({
    candidateProfile,
    jdRequirements,
    matchedSkills = [],
    missingSkills = [],
    gaps = []
}) => {
    return `
You are a Staff Technical Interviewer and Career Strategist.
Generate an in-depth, personalized, and fully explainable interview preparation package for the candidate below.

==================================================
CRITICAL GROUNDING & ANTI-HALLUCINATION RULES:
==================================================
1. Do NOT invent candidate experience, companies, projects, or degrees.
2. Do NOT claim the candidate knows a technology unless it exists in the VERIFIED CANDIDATE PROFILE.
3. For skills in the MISSING SKILLS list, focus questions and roadmap days on how the candidate can learn, adapt, or build practical foundations.
4. Provide an EXPLICIT "reason" for every question and roadmap day (Explainability).
5. If there are missing skills, prioritize them first in the Roadmap. If there are no missing skills, focus on advanced system design, performance, and behavioral practice.
6. The "roadmap" MUST contain between 5 and 7 days. Each day MUST have a list of specific, actionable "tasks". NEVER return an empty roadmap.

==================================================
VERIFIED CANDIDATE PROFILE:
==================================================
- Name / Title: ${candidateProfile?.name || "Candidate"}
- Summary: ${candidateProfile?.summary || "Not specified"}
- Verified Technologies: ${(candidateProfile?.skills || candidateProfile?.allSkills || []).join(", ") || "None specified"}
- Key Projects: ${JSON.stringify(candidateProfile?.projects || [], null, 2)}
- Key Experience: ${JSON.stringify(candidateProfile?.experience || [], null, 2)}

==================================================
TARGET JOB REQUIREMENTS:
==================================================
- Role: ${jdRequirements?.jobTitle || "Target Role"}
- Required Skills: ${(jdRequirements?.requiredSkills || []).join(", ")}
- Preferred Skills: ${(jdRequirements?.preferredSkills || []).join(", ")}
- Key Responsibilities: ${(jdRequirements?.responsibilities || []).join("; ")}

==================================================
DETERMINISTIC SKILL GAP ANALYSIS:
==================================================
- Matched Skills (Candidate possesses): ${matchedSkills.join(", ") || "None"}
- Missing Required/Preferred Skills: ${missingSkills.join(", ") || "None"}
- Critical / Important Gaps: ${JSON.stringify(gaps, null, 2)}

You MUST format your output as a valid JSON object matching this schema:
{
  "technicalQuestions": [
    {
      "question": "Explain how you would implement...",
      "skill": "React",
      "difficulty": "medium",
      "category": "Frontend",
      "source": "resume",
      "reason": "Directly evaluates the candidate's stated experience with React.",
      "intention": "To test understanding of component lifecycle and state management.",
      "answer": "Comprehensive reference answer...",
      "expectedTopics": ["Hooks", "Virtual DOM", "Re-rendering"],
      "followUpQuestions": ["How would you optimize performance?"]
    }
  ],
  "behavioralQuestions": [
    {
      "question": "Tell me about a time you faced a technical disagreement...",
      "category": "Conflict Resolution",
      "source": "behavioral",
      "reason": "Crucial for evaluating teamwork and constructive debate in software engineering.",
      "intention": "Assess empathy and problem resolution.",
      "answer": "STAR formatted model answer...",
      "starTips": ["Situation: Describe the conflict clearly", "Action: Explain how you communicated"]
    }
  ],
  "roadmap": [
    {
      "day": 1,
      "focus": "Topic name (e.g. PostgreSQL fundamentals)",
      "priority": "critical",
      "reason": "Addresses missing required skill identified in JD.",
      "tasks": [
        "Read core architecture overview",
        "Write 5 complex queries with JOIN and GROUP BY",
        "Build a small schema migration"
      ]
    },
    {
      "day": 2,
      "focus": "Topic name (e.g. Docker containerization)",
      "priority": "critical",
      "reason": "Essential requirement for target role deployment workflows.",
      "tasks": [
        "Learn Dockerfile directives",
        "Containerize sample application",
        "Write a docker-compose.yml"
      ]
    }
  ]
}

Return ONLY valid JSON matching the schema above.
`;
};

module.exports = {
    preparationOutputSchema,
    buildPreparationPrompt
};
