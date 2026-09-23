/**
 * Centralized Skill Normalization Service
 * Ensures equivalent technologies are treated consistently across the entire application.
 * All normalization logic and canonical alias dictionaries are defined here.
 */

// Canonical alias dictionary: maps aliases and variants to their canonical normalized form
const CANONICAL_SKILL_MAP = {
    // JavaScript / TypeScript ecosystem
    "js": "javascript",
    "java script": "javascript",
    "javascript": "javascript",
    "es6": "javascript",
    "ecmascript": "javascript",
    "ts": "typescript",
    "type script": "typescript",
    "typescript": "typescript",

    // Runtime & Frameworks (Node / Express / Nest)
    "node": "node.js",
    "nodejs": "node.js",
    "node.js": "node.js",
    "node js": "node.js",
    "express": "express",
    "expressjs": "express",
    "express.js": "express",
    "express js": "express",
    "nest": "nestjs",
    "nestjs": "nestjs",
    "nest.js": "nestjs",
    "fastify": "fastify",

    // Frontend Frameworks & Libraries
    "react": "react",
    "reactjs": "react",
    "react.js": "react",
    "react js": "react",
    "next": "next.js",
    "nextjs": "next.js",
    "next.js": "next.js",
    "vue": "vue.js",
    "vuejs": "vue.js",
    "vue.js": "vue.js",
    "nuxt": "nuxt.js",
    "nuxtjs": "nuxt.js",
    "angular": "angular",
    "angularjs": "angular",
    "angular.js": "angular",
    "svelte": "svelte",
    "sveltekit": "svelte",
    "redux": "redux",
    "redux toolkit": "redux",
    "rtk": "redux",
    "mobx": "mobx",
    "zustand": "zustand",
    "recoil": "recoil",

    // Styling
    "html": "html",
    "html5": "html",
    "css": "css",
    "css3": "css",
    "sass": "sass",
    "scss": "sass",
    "less": "less",
    "tailwind": "tailwindcss",
    "tailwindcss": "tailwindcss",
    "tailwind css": "tailwindcss",
    "bootstrap": "bootstrap",
    "material ui": "material-ui",
    "mui": "material-ui",
    "chakra": "chakra-ui",
    "shadcn": "shadcn-ui",

    // Backend Languages
    "python": "python",
    "python3": "python",
    "py": "python",
    "django": "django",
    "flask": "flask",
    "fastapi": "fastapi",
    "java": "java",
    "spring": "spring-boot",
    "springboot": "spring-boot",
    "spring boot": "spring-boot",
    "golang": "go",
    "go lang": "go",
    "go": "go",
    "c++": "c++",
    "cpp": "c++",
    "c#": "c#",
    "csharp": "c#",
    ".net": ".net",
    "dotnet": ".net",
    "asp.net": "asp.net",
    "rust": "rust",
    "ruby": "ruby",
    "ruby on rails": "ruby-on-rails",
    "rails": "ruby-on-rails",
    "php": "php",
    "laravel": "laravel",

    // Databases
    "mongo": "mongodb",
    "mongodb": "mongodb",
    "mongo db": "mongodb",
    "mongoose": "mongodb",
    "postgres": "postgresql",
    "postgresql": "postgresql",
    "postgres sql": "postgresql",
    "psql": "postgresql",
    "mysql": "mysql",
    "my sql": "mysql",
    "mssql": "sql server",
    "sql server": "sql server",
    "microsoft sql server": "sql server",
    "sqlite": "sqlite",
    "redis": "redis",
    "cassandra": "cassandra",
    "dynamodb": "dynamodb",
    "dynamo db": "dynamodb",
    "couchdb": "couchdb",
    "neo4j": "neo4j",
    "firebase": "firebase",
    "supabase": "supabase",
    "prisma": "prisma",
    "typeorm": "typeorm",
    "sequelize": "sequelize",
    "sql": "sql",
    "nosql": "nosql",

    // Cloud Platforms
    "aws": "aws",
    "amazon web services": "aws",
    "amazon aws": "aws",
    "gcp": "gcp",
    "google cloud": "gcp",
    "google cloud platform": "gcp",
    "azure": "azure",
    "microsoft azure": "azure",
    "heroku": "heroku",
    "vercel": "vercel",
    "netlify": "netlify",
    "digitalocean": "digitalocean",
    "cloudflare": "cloudflare",

    // DevOps, Containers & Tools
    "docker": "docker",
    "containerization": "docker",
    "k8s": "kubernetes",
    "kubernetes": "kubernetes",
    "helm": "helm",
    "terraform": "terraform",
    "ansible": "ansible",
    "jenkins": "jenkins",
    "github actions": "github actions",
    "gitlab ci": "gitlab ci",
    "ci/cd": "ci/cd",
    "cicd": "ci/cd",
    "continuous integration": "ci/cd",
    "git": "git",
    "github": "git",
    "gitlab": "git",
    "bitbucket": "git",
    "linux": "linux",
    "unix": "linux",
    "nginx": "nginx",
    "apache": "apache",

    // Architecture & Concepts
    "rest": "rest api",
    "restful": "rest api",
    "rest api": "rest api",
    "restful api": "rest api",
    "restful apis": "rest api",
    "graphql": "graphql",
    "grpc": "grpc",
    "websockets": "websockets",
    "socket.io": "websockets",
    "microservices": "microservices",
    "microservice": "microservices",
    "system design": "system design",
    "oop": "object-oriented programming",
    "oops": "object-oriented programming",
    "data structures": "data structures & algorithms",
    "dsa": "data structures & algorithms",
    "algorithms": "data structures & algorithms",
    "agile": "agile",
    "scrum": "agile",

    // Testing
    "jest": "jest",
    "vitest": "vitest",
    "mocha": "mocha",
    "chai": "chai",
    "cypress": "cypress",
    "playwright": "playwright",
    "selenium": "selenium",
    "junit": "junit",
    "pytest": "pytest",
    "unit testing": "unit testing",
    "integration testing": "integration testing",

    // Machine Learning & Data Science
    "machine learning": "machine learning",
    "ml": "machine learning",
    "deep learning": "deep learning",
    "dl": "deep learning",
    "artificial intelligence": "ai",
    "ai": "ai",
    "pandas": "pandas",
    "numpy": "numpy",
    "scikit-learn": "scikit-learn",
    "scikit learn": "scikit-learn",
    "sklearn": "scikit-learn",
    "matplotlib": "matplotlib",
    "seaborn": "seaborn",
    "tensorflow": "tensorflow",
    "tf": "tensorflow",
    "pytorch": "pytorch",
    "torch": "pytorch",
    "keras": "keras",
    "nlp": "nlp",
    "computer vision": "computer vision",
    "opencv": "opencv",

    // Authentication & Protocols
    "jwt": "jwt",
    "jwt authentication": "jwt",
    "json web token": "jwt",
    "oauth": "oauth",
    "oauth2": "oauth",
    "oauth 2.0": "oauth",

    // Developer Tools
    "postman": "postman",
    "vs code": "visual studio code",
    "vscode": "visual studio code",
    "visual studio code": "visual studio code",
    "jupyter": "jupyter notebook",
    "jupyter notebook": "jupyter notebook",
    "colab": "google colab",
    "google colab": "google colab",
    "jira": "jira",
    "figma": "figma",

    // Soft Skills
    "communication": "communication",
    "leadership": "leadership",
    "teamwork": "teamwork",
    "problem solving": "problem solving",
    "time management": "time management",
    "collaboration": "teamwork",
    "critical thinking": "critical thinking",
    "mentorship": "leadership"
};

// Skill categorization lookup table
const SKILL_CATEGORIES = {
    languages: new Set([
        "javascript", "typescript", "python", "java", "go", "c++", "c#", ".net", "rust", "ruby", "php", "sql", "html", "css"
    ]),
    frameworks: new Set([
        "react", "next.js", "vue.js", "nuxt.js", "angular", "svelte", "express", "nestjs", "fastify", "django", "flask", "fastapi", "spring-boot", "ruby-on-rails", "laravel", "tailwindcss", "redux"
    ]),
    databases: new Set([
        "mongodb", "postgresql", "mysql", "sql server", "sqlite", "redis", "cassandra", "dynamodb", "couchdb", "neo4j", "firebase", "supabase", "prisma", "typeorm", "sequelize", "nosql"
    ]),
    cloud: new Set([
        "aws", "gcp", "azure", "heroku", "vercel", "netlify", "digitalocean", "cloudflare"
    ]),
    devops: new Set([
        "docker", "kubernetes", "helm", "terraform", "ansible", "jenkins", "github actions", "gitlab ci", "ci/cd", "git", "linux", "nginx", "apache"
    ]),
    softSkills: new Set([
        "communication", "leadership", "teamwork", "problem solving", "time management", "critical thinking"
    ])
};

/**
 * Normalizes a single skill string into its canonical form.
 * Converts to lowercase, strips trailing/leading symbols, and applies canonical aliases.
 * @param {string} raw - The raw skill string to normalize.
 * @returns {string} The canonical normalized skill name.
 */
const normalizeSkill = (raw) => {
    if (!raw || typeof raw !== "string") return "";

    // Trim, convert to lowercase
    let cleaned = raw.trim().toLowerCase();

    // Replace multiple spaces, remove bullet points or hyphens at start
    cleaned = cleaned.replace(/^[\s\-•*]+/, "").replace(/[\s\-•*]+$/, "");

    // Direct check in dictionary
    if (CANONICAL_SKILL_MAP[cleaned]) {
        return CANONICAL_SKILL_MAP[cleaned];
    }

    // Strip common punctuation like commas, parentheses (e.g. "React (v18)" -> "react")
    const stripped = cleaned.replace(/\s*\([^)]*\)/g, "").trim();
    if (CANONICAL_SKILL_MAP[stripped]) {
        return CANONICAL_SKILL_MAP[stripped];
    }

    // Remove trailing 's' for simple plurals if not a known tech name
    if (cleaned.endsWith("s") && !["express", "redis", "postgres", "aws", "kubernetes", "dsa", "microservices"].includes(cleaned)) {
        const singular = cleaned.slice(0, -1);
        if (CANONICAL_SKILL_MAP[singular]) {
            return CANONICAL_SKILL_MAP[singular];
        }
    }

    return stripped;
};

/**
 * Alias for normalizeSkill for consistent naming
 */
const normalizeTechnologyName = normalizeSkill;

/**
 * Normalizes an array of skills, removes empty strings and duplicates.
 * @param {string[]} rawSkills - Array of raw skill strings.
 * @returns {string[]} Array of unique, canonical normalized skill strings.
 */
const normalizeSkills = (rawSkills) => {
    if (!Array.isArray(rawSkills)) return [];

    const seen = new Set();
    const result = [];

    for (const item of rawSkills) {
        if (!item) continue;
        
        // Handle comma-separated skills in a single string (e.g. "React, Node, Express")
        const subItems = typeof item === "string" && item.includes(",") 
            ? item.split(",") 
            : [item];

        for (const sub of subItems) {
            const normalized = normalizeSkill(sub);
            if (normalized && !seen.has(normalized)) {
                seen.add(normalized);
                result.push(normalized);
            }
        }
    }

    return result;
};

/**
 * Categorizes a normalized skill into its technological domain.
 * @param {string} skill - The normalized skill string.
 * @returns {string} The category name ('language', 'framework', 'database', 'cloud', 'devops', 'soft_skill', or 'tool')
 */
const categorizeSkill = (skill) => {
    if (!skill) return "tool";
    const norm = normalizeSkill(skill);

    if (SKILL_CATEGORIES.languages.has(norm)) return "language";
    if (SKILL_CATEGORIES.frameworks.has(norm)) return "framework";
    if (SKILL_CATEGORIES.databases.has(norm)) return "database";
    if (SKILL_CATEGORIES.cloud.has(norm)) return "cloud";
    if (SKILL_CATEGORIES.devops.has(norm)) return "devops";
    if (SKILL_CATEGORIES.softSkills.has(norm)) return "soft_skill";

    return "tool";
};

module.exports = {
    normalizeSkill,
    normalizeSkills,
    normalizeTechnologyName,
    categorizeSkill,
    CANONICAL_SKILL_MAP,
};
