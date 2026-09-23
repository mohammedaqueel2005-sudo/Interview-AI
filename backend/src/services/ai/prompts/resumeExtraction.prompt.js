/**
 * Structured Resume Extraction Prompt and Zod Schema
 * 
 * Extracts verified facts from candidate resume text and self-description.
 * Grounding rule: Only extract information that is explicitly stated. Do not hallucinate.
 */

const { z } = require("zod");

/**
 * Coerces a value that may be a string[], object of arrays, or mixed into a flat string[].
 * Handles: ["a","b"], { technical: ["a"], soft: ["b"] }, "a, b", etc.
 */
const toStringArray = z
    .union([
        z.array(z.any()),
        z.record(z.any()),
        z.string(),
        z.null(),
        z.undefined()
    ])
    .transform((val) => {
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
            return val.split(",").map((s) => s.trim()).filter(Boolean);
        }
        if (typeof val === "object") {
            return Object.values(val)
                .flatMap((v) => (Array.isArray(v) ? v : [v]))
                .map(String)
                .filter(Boolean);
        }
        return [];
    });

/**
 * Coerces a value that may be a string or string[] into a single string.
 */
const toSingleString = z
    .union([z.string(), z.array(z.any()), z.null(), z.undefined()])
    .transform((val) => {
        if (!val) return "";
        if (Array.isArray(val)) return val.join(" ").trim();
        return String(val).trim();
    });

const baseResumeSchema = z.object({
    name: toSingleString.default("").describe("Candidate full name if present"),
    email: toSingleString.default("").describe("Candidate email address if present"),
    phone: toSingleString.default("").describe("Candidate contact number if present"),
    summary: toSingleString.default("").describe("Professional summary or objective"),
    skills: toStringArray.default([]).describe("General technical and professional skills"),
    technicalSkills: toStringArray.default([]).optional(),
    programmingLanguages: toStringArray.default([]).describe("Programming languages mentioned"),
    frameworks: toStringArray.default([]).describe("Frameworks mentioned (e.g. React, Express, Django)"),
    libraries: toStringArray.default([]).describe("Libraries mentioned (e.g. Redux, Axios, Mongoose)"),
    databases: toStringArray.default([]).describe("Databases mentioned (e.g. MongoDB, PostgreSQL)"),
    cloud: toStringArray.default([]).describe("Cloud platforms mentioned (e.g. AWS, Azure, GCP)"),
    devops: toStringArray.default([]).describe("DevOps and container tools mentioned (e.g. Docker, Git, CI/CD)"),
    tools: toStringArray.default([]).describe("Developer tools mentioned (e.g. Postman, VS Code, Figma)"),
    education: z.array(z.object({
        institution: toSingleString.default(""),
        degree: toSingleString.default(""),
        fieldOfStudy: toSingleString.default(""),
        year: toSingleString.default("")
    })).default([]),
    experience: z.array(z.object({
        company: toSingleString.default(""),
        role: toSingleString.default(""),
        duration: toSingleString.default(""),
        highlights: toStringArray.default([]),
        technologiesUsed: toStringArray.default([])
    })).default([]),
    projects: z.array(z.object({
        name: toSingleString.default(""),
        description: toSingleString.default(""),
        technologiesUsed: toStringArray.default([]),
        highlights: toStringArray.default([])
    })).default([]),
    certifications: toStringArray.default([])
}).passthrough();

const structuredResumeSchema = baseResumeSchema.transform((raw) => {
    // If Gemini put skills under technicalSkills instead of skills, merge them
    const combinedSkills = Array.from(new Set([
        ...(raw.skills || []),
        ...(raw.technicalSkills || [])
    ]));

    // Gather technologies from projects and experience
    const projectTech = (raw.projects || []).flatMap(p => p.technologiesUsed || []);
    const experienceTech = (raw.experience || []).flatMap(e => e.technologiesUsed || []);

    // Create a normalized list of all candidate skills
    const allCandidateSkills = Array.from(new Set([
        ...combinedSkills,
        ...(raw.programmingLanguages || []),
        ...(raw.frameworks || []),
        ...(raw.libraries || []),
        ...(raw.databases || []),
        ...(raw.cloud || []),
        ...(raw.devops || []),
        ...(raw.tools || []),
        ...projectTech,
        ...experienceTech
    ])).filter(Boolean);

    return {
        ...raw,
        skills: combinedSkills.length > 0 ? combinedSkills : allCandidateSkills,
        allSkills: allCandidateSkills
    };
});

const buildResumeExtractionPrompt = ({ resumeText = "", selfDescription = "" }) => {
    return `
You are an expert technical resume parser.
Analyze the candidate's resume text and self-description and extract a clean, strictly structured JSON representation.

STRICT GROUNDING RULES:
1. ONLY extract information that is explicitly present in the provided text.
2. DO NOT invent or assume skills, projects, companies, education, or years of experience.
3. If a section is missing or empty, return an empty array [] or empty string "".
4. Separate programming languages, frameworks, databases, cloud, devops, and developer tools.

You MUST format your response as a valid JSON object matching this schema:
{
  "name": "Candidate Name",
  "email": "email@example.com",
  "phone": "+1234567890",
  "summary": "Professional summary...",
  "skills": ["Java", "JavaScript", "React", "Node.js", "MongoDB", "MySQL", "Git"],
  "programmingLanguages": ["Java", "JavaScript", "Python"],
  "frameworks": ["React", "Express.js"],
  "libraries": ["Redux", "Pandas", "NumPy"],
  "databases": ["MongoDB", "MySQL"],
  "cloud": ["AWS"],
  "devops": ["Docker", "Git"],
  "tools": ["VS Code", "Postman"],
  "education": [
    { "institution": "College Name", "degree": "B.E. Computer Science", "fieldOfStudy": "CSE", "year": "2027" }
  ],
  "experience": [],
  "projects": [
    { "name": "Project Name", "description": "Details...", "technologiesUsed": ["React", "Node.js"] }
  ],
  "certifications": []
}

Candidate Resume Text:
${resumeText || "No resume text provided."}

Candidate Self Description:
${selfDescription || "No self description provided."}

Return ONLY valid JSON matching the schema above.
`;
};

module.exports = {
    structuredResumeSchema,
    buildResumeExtractionPrompt
};
