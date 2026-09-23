import apiClient from "./apiClient";

export const interviewService = {
  async generate({ jobDescription, selfDescription, resumeFile }) {
    const form = new FormData();
    form.append("jobDescription", jobDescription);
    if (selfDescription) form.append("selfDescription", selfDescription);
    if (resumeFile) form.append("resume", resumeFile);
    const { data } = await apiClient.post("/api/interview", form);
    return data;
  },
  list: () => apiClient.get("/api/interview").then(({ data }) => data.interviewReports || []),
  getById: (id) => apiClient.get(`/api/interview/report/${id}`).then(({ data }) => data.interviewReport || data.report),
  assess: (id, payload) => apiClient.post(`/api/interview/report/${id}/assess`, payload).then(({ data }) => data.assessment),
  downloadResume: (id) => apiClient.post(`/api/interview/resume/pdf/${id}`, null, { responseType: "blob" }).then(({ data }) => data),
};
