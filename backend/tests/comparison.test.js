/**
 * Unit Tests for Deterministic Skill Comparison & Gap Classification
 * Run with: node --test backend/tests/comparison.test.js
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { compareSkills } = require("../src/services/comparison.service");

describe("Deterministic Skill Comparison Service", () => {

    it("should accurately match core skills and calculate exact match percentage (3 of 4 = 75%)", () => {
        const candidateSkills = ["JavaScript", "React", "Node.js"];
        const jdRequirements = {
            requiredSkills: ["JavaScript", "React", "Node.js", "PostgreSQL"],
            preferredSkills: []
        };

        const result = compareSkills({ candidateSkills, jdRequirements });

        assert.equal(result.requiredSkillCount, 4);
        assert.equal(result.matchedSkillCount, 3);
        assert.equal(result.matchPercentage, 75);
        assert.ok(result.matchedSkills.includes("javascript"));
        assert.ok(result.matchedSkills.includes("react"));
        assert.ok(result.matchedSkills.includes("node.js"));
        assert.deepEqual(result.missingSkills, ["postgresql"]);
        assert.equal(result.missingSkills.length, 1);
    });

    it("should match skills across aliases (candidate has 'JS', JD has 'JavaScript')", () => {
        const candidateSkills = ["JS", "ReactJS", "NodeJS"];
        const jdRequirements = {
            requiredSkills: ["JavaScript", "React", "Node.js"]
        };

        const result = compareSkills({ candidateSkills, jdRequirements });

        assert.equal(result.matchedSkills.length, 3);
        assert.equal(result.missingSkills.length, 0);
        assert.equal(result.matchPercentage, 100);
    });

    it("should accurately calculate 5 of 7 matched skills = 71.43% (User Acceptance Test Case)", () => {
        const candidateSkills = [
            "Java", "Python", "JavaScript", "React", "Node.js", "Express", "MySQL", "MongoDB"
        ];
        const jdRequirements = {
            requiredSkills: [
                "Java", "JavaScript", "React", "Node.js", "Express", "PostgreSQL", "Docker"
            ]
        };

        const result = compareSkills({ candidateSkills, jdRequirements });

        assert.equal(result.requiredSkillCount, 7);
        assert.equal(result.matchedSkillCount, 5);
        assert.equal(result.matchPercentage, 71.43);
        assert.equal(result.skillsAnalysis.matchedSkills.length, 5);
        assert.equal(result.skillsAnalysis.missingSkills.length, 2);
        assert.equal(result.skillsAnalysis.requiredSkillCount, 7);
        assert.equal(result.skillsAnalysis.matchedSkillCount, 5);
        assert.equal(result.skillsAnalysis.matchPercentage, 71.43);
        assert.deepEqual(result.skillsAnalysis.missingSkills.sort(), ["docker", "postgresql"]);
        assert.deepEqual(result.skillsAnalysis.verifiedStrengths.sort(), ["express", "java", "javascript", "node.js", "react"]);
    });

    it("should classify gaps by severity with explainable reasons", () => {
        const candidateSkills = ["HTML", "CSS", "JavaScript"];
        const jdRequirements = {
            requiredSkills: ["JavaScript", "PostgreSQL", "Node.js"],
            preferredSkills: ["Docker", "AWS"]
        };

        const result = compareSkills({ candidateSkills, jdRequirements });

        // PostgreSQL & Node.js are missing required core skills -> high severity
        const postgresGap = result.gaps.find(g => g.skill === "postgresql");
        assert.ok(postgresGap);
        assert.equal(postgresGap.severity, "high");
        assert.equal(postgresGap.category, "Database");
        assert.ok(postgresGap.reason.length > 10);

        // Docker is missing preferred skill -> low severity
        const dockerGap = result.gaps.find(g => g.skill === "docker");
        assert.ok(dockerGap);
        assert.equal(dockerGap.severity, "low");
    });

    it("should handle empty candidate skills gracefully", () => {
        const candidateSkills = [];
        const jdRequirements = {
            requiredSkills: ["Python", "Django", "PostgreSQL"]
        };

        const result = compareSkills({ candidateSkills, jdRequirements });

        assert.equal(result.matchedSkillCount, 0);
        assert.equal(result.matchPercentage, 0);
        assert.equal(result.missingSkills.length, 3);
    });

    it("should handle empty JD requirements by returning insufficient_data instead of 50%", () => {
        const candidateSkills = ["JavaScript", "React"];
        const jdRequirements = {};

        const result = compareSkills({ candidateSkills, jdRequirements });

        assert.equal(result.requiredSkillCount, 0);
        assert.equal(result.missingSkills.length, 0);
        assert.equal(result.matchPercentage, null);
        assert.equal(result.skillsAnalysis.status, "insufficient_data");
    });

    it("should identify additional skills candidate possesses outside JD", () => {
        const candidateSkills = ["JavaScript", "React", "Rust", "GraphQL"];
        const jdRequirements = {
            requiredSkills: ["JavaScript", "React"]
        };

        const result = compareSkills({ candidateSkills, jdRequirements });

        assert.ok(result.additionalSkills.includes("rust"));
        assert.ok(result.additionalSkills.includes("graphql"));
        assert.equal(result.matchPercentage, 100);
    });

});
