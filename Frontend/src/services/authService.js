import apiClient from "./apiClient";

export const authService = {
  register: (payload) => apiClient.post("/api/auth/register", payload).then(({ data }) => data),
  login: (payload) => apiClient.post("/api/auth/login", payload).then(({ data }) => data),
  logout: () => apiClient.get("/api/auth/logout").then(({ data }) => data),
  getMe: () => apiClient.get("/api/auth/get-me").then(({ data }) => data),
};
