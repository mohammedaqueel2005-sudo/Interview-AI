const express = require("express");
const authMiddleWare = require("../middlewares/auth.middleware")
const interviewController = require("../controller/interview.controller");
const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router();

/**
 * @route POST /api/interview
 * @description generate new interview report on the basis of user self description, job description and resume pdf
 * @access private
 */
interviewRouter.post("/", authMiddleWare.authUser, upload.single("resume"),interviewController.generateInterviewReportControoler);

/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleWare.authUser, interviewController.getInterviewByIdController);

/**
 * @route GET /api/interview
 * @description get all interview report of logged in user
 * @access private
 */

interviewRouter.get("/", authMiddleWare.authUser,interviewController.getAllInterviewReportsController);

/**
 * @route POST /api/interview/resume/pdf
 * @description genrate resume pdf on the basis of user self description, resume, job description
 * @access private
 */

interviewRouter.post("/resume/pdf/:interviewReportId",authMiddleWare.authUser, interviewController.genertateResumePdfController);

module.exports = interviewRouter;