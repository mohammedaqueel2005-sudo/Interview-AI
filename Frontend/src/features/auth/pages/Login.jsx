import { useState } from 'react';
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router";
import { useAuth } from '../hooks/useAuth';

const Login = () => {
    

    const { loading, handleLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        if (!email.trim() || !password.trim()) {
            setErrorMessage("Please enter both email and password.");
            return;
        }
        const result = await handleLogin({ email, password });
        if (result && result.success) {
            navigate(location.state?.from?.pathname || '/');
        } else {
            setErrorMessage(result?.error || "Login failed. Please check your credentials.");
        }
    }

  return (
    <main className="auth-page"><section className="auth-card"><div className="auth-brand"><Sparkles size={18}/> InterviewAI</div><h1>Welcome back</h1><p>Sign in to continue your interview preparation.</p>
      <form onSubmit={handleSubmit} noValidate>
        <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" id="email" name="email" autoComplete="email" placeholder="you@example.com" /></label>
        <label>Password<span className="password-field"><input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} id="password" name="password" autoComplete="current-password" placeholder="Your password"/><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span></label>
        {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
        <button className="button button-primary button-block" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      </form><p className="auth-switch">New to InterviewAI? <Link to="/register">Create an account</Link></p>
    </section></main>
  );
}

export default Login;
