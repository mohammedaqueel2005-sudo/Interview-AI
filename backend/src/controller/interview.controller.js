const pdfParse = require("pdf-parse");
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");
const { ReinforcementTuningParseResponseConfig } = require("@google/genai");

/**
 * @description Controller to generate interview report based on user self description, resume and job description
 * 
 */
const generateInterviewReportControoler = async (req, res) => {

    const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText();
    const { selfDescription, jobDescription} = req.body;

    const interviewReportByAi = await generateInterviewReport({
        resume: resumeContent,
        selfDescription,
        jobDescription,
    });

//     console.log(resumeContent);
// console.log(typeof resumeContent);

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeContent.text,
        selfDescription,
        jobDescription,
        ...interviewReportByAi
    });

    res.status(201).json({
        message: "Interview generated successfully",
        interviewReport
    })
}

/**
 * @description controller to get interview report by interviewId 
 */
const getInterviewByIdController = async (req, res) => {
    const { interviewId } = req.params;

    const interviewReport = await interviewReportModel.findOne( { _id : interviewId, user: req.user.id } );

    if(!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found.",
        });
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    });

}

/**
 * @description Controller to get all interview reports of logged in user
 */
const getAllInterviewReportsController = async (req, res) => {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1}).select("-resume -selfDescription -jobDescription -_v -technicalQuestions -behavariolQuestions -skillGaps -preparationPlan ");

    res.status(200).json({
        message: "Interview reports fetched successfully",
        interviewReports
    })
}

/**
 * @description controller to generate resume PDF based on user self description, resume, and job description.
 */
const genertateResumePdfController = async (req, res) => {
    const { interviewReportId } = req.params;

    const interviewReport = await interviewReportModel.findById(interviewReportId);

    if(!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        });
    }

    const { resume, selfDescription, jobDescription } = interviewReport;

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription });

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    });

    res.send(pdfBuffer);
}

module.exports = {
    generateInterviewReportControoler,
    getInterviewByIdController,
    getAllInterviewReportsController,
    genertateResumePdfController,
}