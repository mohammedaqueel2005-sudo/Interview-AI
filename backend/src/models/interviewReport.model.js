const mongoose = require('mongoose');

/**
 * - job description schema: String
 * - resume text : string
 * - self description : string
 * 
 * -- matchScore: Number;
 * 
 * - Technical questions: [{
 *      question:"",
 *      intention: "",
 *      answer: "",
 * }]
 * - behavioral question: [{
 *      question:"",
 *      intention: "",
 *      answer: "",
 * }]
 * - skill gaps: [{
 *      skill: "",
 *      sevrity: {
 *          type:String,
 *          enum: ["low", "meduim", "high"]
 *   }
 * }]
 * - preparation plan: [{
 *      day: number,
 *      focus: string,
 *      task: [string]
 * }] 
 */

const technicalQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, "Technical question is required"],
    },
    intention: {
        type: String,
        default: ""
    },
    answer: {
        type: String,
        default: ""
    },
    skill: {
        type: String,
        default: ""
    },
    difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "medium"
    },
    category: {
        type: String,
        default: "General"
    },
    source: {
        type: String,
        enum: ["resume", "jd", "gap", "behavioral", "project"],
        default: "jd"
    },
    reason: {
        type: String,
        default: "Relevant to job requirements"
    },
    expectedTopics: [{
        type: String
    }],
    followUpQuestions: [{
        type: String
    }]
}, {
    _id: false
});

const behavioralQuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, "Behavioral question is required"],
    },
    intention: {
        type: String,
        default: ""
    },
    answer: {
        type: String,
        default: ""
    },
    category: {
        type: String,
        default: "General"
    },
    source: {
        type: String,
        enum: ["resume", "jd", "gap", "behavioral", "project"],
        default: "behavioral"
    },
    reason: {
        type: String,
        default: "Evaluates cultural and situational fit"
    },
    starTips: [{
        type: String
    }]
}, {
    _id: false
});

const skillGapSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: [true, "Skill is required"],
    },
    severity: {
        type: String,
        enum: ["low", "medium", "high"],
        required: [true, "Severity is required"]
    },
    category: {
        type: String,
        default: "Technical"
    },
    reason: {
        type: String,
        default: ""
    }
}, {
    _id: false
});

const preparationPlanSchema = new mongoose.Schema({
    day: {
        type: Number,
        required: [true, "Day is required"],
    },
    focus: {
        type: String,
        required: [true, "Focus is required"],
    },
    tasks: [{
        type: String,
        required: [true, "Task is required"]
    }],
    priority: {
        type: String,
        enum: ["critical", "important", "optional"],
        default: "important"
    },
    reason: {
        type: String,
        default: ""
    },
    completed: {
        type: Boolean,
        default: false
    }
}, {
    _id: false
});

const assessmentSchema = new mongoose.Schema({
    questionIndex: {
        type: Number
    },
    questionText: {
        type: String,
        required: true
    },
    userAnswer: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        min: 1,
        max: 10,
        required: true
    },
    technicalAccuracy: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    communication: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    completeness: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    starStructure: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    strengths: [{
        type: String
    }],
    missingPoints: [{
        type: String
    }],
    improvementSuggestions: [{
        type: String
    }],
    betterAnswer: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const interviewReportSchema = new mongoose.Schema({
    jobDescription: {
        type: String,
        required: true,
    },
    resume: {
        type: String,
        default: ""
    },
    selfDescription: {
        type: String,
        default: ""
    },
    structuredResume: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    structuredJd: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    skillAnalysis: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    skillsAnalysis: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    matchScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    technicalQuestions: [technicalQuestionSchema],
    behavioralQuestions: [behavioralQuestionSchema],
    skillGaps: [skillGapSchema],
    preparationPlan: [preparationPlanSchema],
    roadmap: [preparationPlanSchema],
    verifiedStrengths: [{
        type: String
    }],
    assessments: [assessmentSchema],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
        index: true
    },
    title: {
        type: String,
        required: [true, "Job title is required"],
        default: "Target Role"
    }
}, {
    timestamps: true
});

interviewReportSchema.index({ user: 1, createdAt: -1 });

// Register with both correct name and legacy name for backwards compatibility
const interviewReportModel = mongoose.models.interviewReport || mongoose.model("interviewReport", interviewReportSchema);

module.exports = interviewReportModel;