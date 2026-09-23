import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
    baseURL,
    withCredentials: true
});

export const register = async ({ username, email, password }) => {
    try {
        const response = await api.post('/api/auth/register', {
            username, 
            email, 
            password
        });
        return response.data;
    } catch (err) {
        throw err;
    }
};

export const login = async ({ email, password }) => {
    try {
        const response = await api.post("/api/auth/login", {
            email, 
            password
        });
        return response.data;
    } catch (err) {
        throw err;
    }
};

export const logout = async () => {
    try {
        const response = await api.get("/api/auth/logout");
        return response.data;
    } catch (err) {
        throw err;
    }
};

export const getMe = async () => {
    try {
        const response = await api.get("/api/auth/get-me");
        return response.data;
    } catch (err) {
        throw err;
    }
};