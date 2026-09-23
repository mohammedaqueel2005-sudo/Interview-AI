/**
 * Unit Tests for Skill Normalization Layer
 * Run with: node --test backend/tests/normalization.test.js
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { normalizeSkill, normalizeSkills, categorizeSkill } = require("../src/services/skill.service");

describe("Skill Normalization Service", () => {

    it("should normalize core framework and runtime aliases", () => {
        assert.equal(normalizeSkill("ReactJS"), "react");
        assert.equal(normalizeSkill("React.js"), "react");
        assert.equal(normalizeSkill("React js"), "react");
        assert.equal(normalizeSkill("Node"), "node.js");
        assert.equal(normalizeSkill("NodeJS"), "node.js");
        assert.equal(normalizeSkill("Node.js"), "node.js");
        assert.equal(normalizeSkill("Node JS"), "node.js");
        assert.equal(normalizeSkill("Express JS"), "express");
        assert.equal(normalizeSkill("Express.js"), "express");
    });

    it("should normalize database aliases", () => {
        assert.equal(normalizeSkill("Mongo DB"), "mongodb");
        assert.equal(normalizeSkill("MongoDB"), "mongodb");
        assert.equal(normalizeSkill("Mongoose"), "mongodb");
        assert.equal(normalizeSkill("Postgres"), "postgresql");
        assert.equal(normalizeSkill("PostgreSQL"), "postgresql");
        assert.equal(normalizeSkill("Postgres SQL"), "postgresql");
        assert.equal(normalizeSkill("PSQL"), "postgresql");
    });

    it("should normalize language and cloud aliases", () => {
        assert.equal(normalizeSkill("JS"), "javascript");
        assert.equal(normalizeSkill("Java Script"), "javascript");
        assert.equal(normalizeSkill("TS"), "typescript");
        assert.equal(normalizeSkill("Type Script"), "typescript");
        assert.equal(normalizeSkill("AWS"), "aws");
        assert.equal(normalizeSkill("Amazon Web Services"), "aws");
        assert.equal(normalizeSkill("K8s"), "kubernetes");
        assert.equal(normalizeSkill("Kubernetes"), "kubernetes");
    });

    it("should deduplicate and normalize arrays of mixed skills", () => {
        const rawSkills = [
            "ReactJS",
            "react",
            "NodeJS",
            "node.js",
            "Mongo DB",
            "mongodb",
            "JavaScript",
            "JS",
            "Docker"
        ];

        const normalized = normalizeSkills(rawSkills);
        assert.deepEqual(normalized, [
            "react",
            "node.js",
            "mongodb",
            "javascript",
            "docker"
        ]);
    });

    it("should split and normalize comma-separated strings", () => {
        const rawSkills = ["React, Node, Express, MongoDB"];
        const normalized = normalizeSkills(rawSkills);
        assert.deepEqual(normalized, ["react", "node.js", "express", "mongodb"]);
    });

    it("should gracefully handle null, undefined, and empty inputs", () => {
        assert.equal(normalizeSkill(null), "");
        assert.equal(normalizeSkill(undefined), "");
        assert.equal(normalizeSkill(""), "");
        assert.deepEqual(normalizeSkills([]), []);
        assert.deepEqual(normalizeSkills([null, "", undefined]), []);
    });

    it("should categorize skills accurately", () => {
        assert.equal(categorizeSkill("javascript"), "language");
        assert.equal(categorizeSkill("react"), "framework");
        assert.equal(categorizeSkill("mongodb"), "database");
        assert.equal(categorizeSkill("aws"), "cloud");
        assert.equal(categorizeSkill("docker"), "devops");
        assert.equal(categorizeSkill("leadership"), "soft_skill");
    });

});
