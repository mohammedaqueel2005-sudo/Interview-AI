const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const interviewController = require("../controller/interview.controller");
const upload = require("../middlewares/file.middleware");
const { interviewLimiter } = require("../middlewares/rateLimiter.middleware");

const interviewRouter = express.Router();

/**
 * @route POST /api/interview
 * @description Generate new interview report on the basis of user self-description, job description, and resume PDF
 * @access Private
 */
interviewRouter.post(
    "/",
    authMiddleware.authUser,
    interviewLimiter,
    upload.single("resume"),
    interviewController.generateInterviewReportController
);

/**
 * @route GET /api/interview/report/:interviewId
 * @description Get interview report by interviewId
 * @access Private
 */
interviewRouter.get(
    "/report/:interviewId",
    authMiddleware.authUser,
    interviewController.getInterviewByIdController
);

/**
 * @route GET /api/interview
 * @description Get all interview reports of logged in user
 * @access Private
 */
interviewRouter.get(
    "/",
    authMiddleware.authUser,
    interviewController.getAllInterviewReportsController
);

/**
 * @route POST /api/interview/report/:interviewId/assess
 * @description Submit a candidate's answer for evaluation and scoring
 * @access Private
 */
interviewRouter.post(
    "/report/:interviewId/assess",
    authMiddleware.authUser,
    interviewLimiter,
    interviewController.evaluateAnswerController
);

// Route alias for assessment
interviewRouter.post(
    "/:interviewId/assess",
    authMiddleware.authUser,
    interviewLimiter,
    interviewController.evaluateAnswerController
);

/**
 * @route POST /api/interview/resume/pdf/:interviewReportId
 * @description Generate tailored resume PDF on the basis of candidate profile and job description
 * @access Private
 */
interviewRouter.post(
    "/resume/pdf/:interviewReportId",
    authMiddleware.authUser,
    interviewLimiter,
    interviewController.generateResumePdfController
);

module.exports = interviewRouter;