import { createContext, useEffect, useMemo, useState } from "react";
import { authService } from "../../services/authService";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => { authService.getMe().then((data) => setUser(data.user)).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
    const messageFor = (error, fallback) => error.response?.data?.message || error.message || fallback;
    const value = useMemo(() => ({ user, loading,
        async handleLogin(payload) { setLoading(true); try { const data = await authService.login(payload); setUser(data.user); return { success: true }; } catch (error) { return { success: false, error: messageFor(error, "Unable to sign in.") }; } finally { setLoading(false); } },
        async handleRegister(payload) { setLoading(true); try { const data = await authService.register(payload); setUser(data.user); return { success: true }; } catch (error) { return { success: false, error: messageFor(error, "Unable to create your account.") }; } finally { setLoading(false); } },
        async handleLogout() { try { await authService.logout(); } finally { setUser(null); } },
    }), [user, loading]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
