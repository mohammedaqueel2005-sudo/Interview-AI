import { 
    getAllInterviewReports, 
    generateInterviewReport, 
    getInterviewReportById, 
    generateResumePdf,
    submitAnswerAssessment 
} from "../services/interview.api";
import { useContext, useEffect, useState } from "react";
import { InterviewContext } from "../interview.context";
import { useParams } from "react-router";

export const useInterview = () => {
    const context = useContext(InterviewContext);
    const { interviewId } = useParams();

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider");
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context;
    const [ pdfLoading, setPdfLoading ] = useState(false);
    const [ pdfError, setPdfError ] = useState("");

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true);
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile });
            const rep = response?.interviewReport || response?.report || response;
            if (rep && (rep._id || rep.title)) {
                setReport(rep);
                return { success: true, interviewReport: rep, report: rep };
            }
            throw new Error(response?.message || "Failed to generate report.");
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to generate interview strategy.";
            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    };

    const getReportById = async (id) => {
        setLoading(true);
        try {
            const response = await getInterviewReportById(id);
            const rep = response?.interviewReport || response?.report || response;
            setReport(rep);
            return rep;
        } catch (error) {
            console.error("Failed to fetch interview report:", error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const getReports = async () => {
        setLoading(true);
        try {
            const response = await getAllInterviewReports();
            setReports(response.interviewReports || []);
            return response.interviewReports;
        } catch (error) {
            console.error("Failed to fetch interview reports history:", error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const evaluateAnswer = async ({ interviewId, questionIndex, questionText, userAnswer, questionType }) => {
        try {
            const response = await submitAnswerAssessment({
                interviewId,
                questionIndex,
                questionText,
                userAnswer,
                questionType
            });
            return { success: true, assessment: response.assessment };
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Failed to evaluate answer.";
            return { success: false, error: message };
        }
    };

    const getResumePdf = async (interviewReportId) => {
        // Use pdfLoading (not global setLoading) to avoid hiding content during PDF gen
        setPdfLoading(true);
        setPdfError("");
        try {
            const response = await generateResumePdf({ interviewReportId });
            const url = window.URL.createObjectURL(new Blob([response], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `tailored_resume_${interviewReportId}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            return { success: true };
        } catch (error) {
            console.error("Failed to download resume PDF:", error);
            const message = error.response?.data?.message || error.message || "Could not generate resume PDF. Please try again.";
            setPdfError(message);
            return { success: false, error: message };
        } finally {
            setPdfLoading(false);
        }
    };

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId);
        } else {
            getReports();
        }
    }, [interviewId]);

    return { 
        loading, 
        report, 
        reports, 
        generateReport, 
        getReportById, 
        getReports, 
        evaluateAnswer, 
        getResumePdf,
        pdfLoading,
        pdfError
    };
};