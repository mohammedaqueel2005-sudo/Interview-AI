/**
 * Interview Controller
 * 
 * Thin HTTP controller delegating business logic to interview.service and assessment.service.
 */

const interviewReportModel = require("../models/interviewReport.model");
const { generateInterviewPipeline, getInterviewReportById, getAllInterviewReports } = require("../services/interview.service");
const { evaluateCandidateAnswer } = require("../services/assessment.service");
const { generateResumePdf } = require("../services/ai.service");

/**
 * Controller to generate an interview report based on user resume/self-description and job description.
 */
const generateInterviewReportController = async (req, res, next) => {
    try {
        const { selfDescription, jobDescription } = req.body;
        const resumeFile = req.file || null;

        const interviewReport = await generateInterviewPipeline({
            userId: req.user.id,
            jobDescription,
            selfDescription,
            resumeFile
        });

        return res.status(201).json({
            success: true,
            message: "Interview strategy generated successfully",
            interviewReport,
            report: interviewReport
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Controller to get a single interview report by interviewId.
 */
const getInterviewByIdController = async (req, res, next) => {
    try {
        const { interviewId } = req.params;
        const interviewReport = await getInterviewReportById(interviewId, req.user.id);

        return res.status(200).json({
            success: true,
            message: "Interview report fetched successfully.",
            interviewReport,
            report: interviewReport
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Controller to get all interview reports for the logged in user.
 */
const getAllInterviewReportsController = async (req, res, next) => {
    try {
        const interviewReports = await getAllInterviewReports(req.user.id);

        return res.status(200).json({
            success: true,
            message: "Interview reports fetched successfully",
            interviewReports
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Controller to evaluate a candidate's answer to a specific interview question.
 */
const evaluateAnswerController = async (req, res, next) => {
    try {
        const { interviewId } = req.params;
        const { questionIndex, questionText, userAnswer, questionType } = req.body;

        const assessment = await evaluateCandidateAnswer({
            interviewId,
            userId: req.user.id,
            questionIndex,
            questionText,
            userAnswer,
            questionType
        });

        return res.status(200).json({
            success: true,
            message: "Answer evaluated successfully",
            assessment
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Controller to generate and download a tailored resume PDF.
 */
const generateResumePdfController = async (req, res, next) => {
    try {
        const { interviewReportId } = req.params;

        const interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        });

        if (!interviewReport) {
            return res.status(404).json({
                success: false,
                message: "Interview report not found.",
                code: "REPORT_NOT_FOUND"
            });
        }

        const { resume, selfDescription, jobDescription } = interviewReport;

        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription });

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        });

        return res.send(pdfBuffer);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    generateInterviewReportController,
    getInterviewByIdController,
    getAllInterviewReportsController,
    evaluateAnswerController,
    generateResumePdfController,
    // Backwards compatibility aliases for typo variants in legacy code
    generateInterviewReportControoler: generateInterviewReportController,
    genertateResumePdfController: generateResumePdfController
};