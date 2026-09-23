/**
 * Structured Job Description Extraction Prompt and Resilient Zod Schema
 * 
 * Extracts structured requirements, technical expectations, and qualifications from raw JD text.
 * Robustly maps any nested AI output format (toolsAndTechnologies, technicalSkills, flat skills)
 * into normalized arrays so requirements are never lost.
 */

const { z } = require("zod");

/**
 * Coerces various forms of skill collections (arrays, objects, comma-separated strings) into string[]
 */
const extractSkillList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) {
        return val.flatMap(item => {
            if (typeof item === "string") {
                return item.includes(",") ? item.split(",").map(s => s.trim()) : [item.trim()];
            }
            if (typeof item === "object" && item !== null) {
                return Object.values(item).flatMap(v => Array.isArray(v) ? v : [String(v)]);
            }
            return [String(item)];
        }).filter(Boolean);
    }
    if (typeof val === "string") {
        return val.split(",").map(s => s.trim()).filter(Boolean);
    }
    if (typeof val === "object" && val !== null) {
        return Object.values(val).flatMap(v => extractSkillList(v));
    }
    return [];
};

const rawJdSchema = z.object({
    jobTitle: z.union([z.string(), z.null(), z.undefined()]).transform(v => (v && typeof v === "string" && v.trim()) ? v.trim() : "Target Role"),
    requiredSkills: z.any().optional(),
    preferredSkills: z.any().optional(),
    programmingLanguages: z.any().optional(),
    frameworks: z.any().optional(),
    databases: z.any().optional(),
    cloud: z.any().optional(),
    devops: z.any().optional(),
    tools: z.any().optional(),
    softSkills: z.any().optional(),
    experienceRequirements: z.any().optional(),
    educationRequirements: z.any().optional(),
    responsibilities: z.any().optional(),
    // Possible alternate structures from Gemini
    toolsAndTechnologies: z.any().optional(),
    technicalSkills: z.any().optional(),
    skills: z.any().optional(),
    requirements: z.any().optional()
}).passthrough();

const structuredJdSchema = rawJdSchema.transform((raw) => {
    // 1. Gather all required skills from standard and alternative fields
    const reqList = [
        ...extractSkillList(raw.requiredSkills),
        ...extractSkillList(raw.toolsAndTechnologies?.required),
        ...extractSkillList(raw.technicalSkills?.required),
        ...extractSkillList(raw.requirements?.technical),
        ...extractSkillList(raw.requirements?.skills)
    ];

    // If still empty but flat skills exists
    if (reqList.length === 0 && raw.skills) {
        reqList.push(...extractSkillList(raw.skills));
    }

    // 2. Gather preferred skills
    const prefList = [
        ...extractSkillList(raw.preferredSkills),
        ...extractSkillList(raw.toolsAndTechnologies?.preferred),
        ...extractSkillList(raw.technicalSkills?.preferred),
        ...extractSkillList(raw.requirements?.preferred)
    ];

    // 3. Extract specialized categories
    const programmingLanguages = extractSkillList(raw.programmingLanguages);
    const frameworks = extractSkillList(raw.frameworks);
    const databases = extractSkillList(raw.databases);
    const cloud = extractSkillList(raw.cloud);
    const devops = extractSkillList(raw.devops);
    const tools = extractSkillList(raw.tools);
    const softSkills = extractSkillList(raw.softSkills || raw.softSkills?.required);
    const responsibilities = extractSkillList(raw.responsibilities);
    const experienceRequirements = extractSkillList(raw.experienceRequirements);
    const educationRequirements = extractSkillList(raw.educationRequirements || raw.education?.required);

    // If requiredSkills is empty, fall back to union of specific tech fields
    if (reqList.length === 0) {
        reqList.push(
            ...programmingLanguages,
            ...frameworks,
            ...databases,
            ...tools,
            ...devops
        );
    }

    // Unique required and preferred
    const uniqueRequired = Array.from(new Set(reqList.map(s => s.trim()).filter(Boolean)));
    const reqSet = new Set(uniqueRequired.map(s => s.toLowerCase()));
    const uniquePreferred = Array.from(new Set(
        prefList
            .map(s => s.trim())
            .filter(Boolean)
            .filter(s => !reqSet.has(s.toLowerCase()))
    ));

    // allSkills contains everything extracted from the JD
    const allSkills = Array.from(new Set([
        ...uniqueRequired,
        ...uniquePreferred,
        ...programmingLanguages,
        ...frameworks,
        ...databases,
        ...cloud,
        ...devops,
        ...tools
    ]));

    return {
        jobTitle: raw.jobTitle || "Target Role",
        requiredSkills: uniqueRequired,
        preferredSkills: uniquePreferred,
        allSkills,
        programmingLanguages,
        frameworks,
        databases,
        cloud,
        devops,
        tools,
        softSkills,
        experienceRequirements,
        educationRequirements,
        responsibilities
    };
});

const buildJdExtractionPrompt = ({ jobDescription }) => {
    return `
You are an expert technical recruiter and job analyst.
Analyze the provided Job Description (JD) and extract a structured, standardized JSON breakdown of all expectations.

STRICT GROUNDING & EXTRACTION RULES:
1. Distinguish between REQUIRED (mandatory / core) skills and PREFERRED (nice-to-have / bonus) skills.
2. Extract specific technical terms clearly (e.g., "React", "Node.js", "Express", "MongoDB", "MySQL", "PostgreSQL", "Docker", "AWS", "Git").
3. Always extract technology names into the "requiredSkills" and "preferredSkills" arrays.
4. If a specific section is not mentioned, return an empty array [].
5. Do NOT fabricate skills not implied or mentioned in the text.

You MUST format your response as a valid JSON object strictly matching this schema:
{
  "jobTitle": "Role Title",
  "requiredSkills": ["Skill 1", "Skill 2"],
  "preferredSkills": ["Skill 3"],
  "programmingLanguages": ["Java", "JavaScript", "Python"],
  "frameworks": ["React", "Express", "Node.js"],
  "databases": ["MongoDB", "MySQL"],
  "cloud": ["AWS", "GCP"],
  "devops": ["Docker", "Git", "CI/CD"],
  "tools": ["Git", "Postman", "VS Code"],
  "softSkills": ["Communication", "Teamwork", "Problem Solving"],
  "responsibilities": ["Key duty 1", "Key duty 2"],
  "experienceRequirements": ["1+ years", "Fresher / Intern"],
  "educationRequirements": ["Bachelor in Computer Science"]
}

Job Description:
${jobDescription}

Return ONLY valid JSON matching the schema above.
`;
};

module.exports = {
    structuredJdSchema,
    buildJdExtractionPrompt
};
