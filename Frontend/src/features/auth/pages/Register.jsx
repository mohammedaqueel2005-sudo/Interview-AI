import { useState } from 'react';
import { useNavigate, Link } from "react-router";
import { useAuth } from '../hooks/useAuth';
import { Sparkles } from "lucide-react";

const Register = () => {

  const navigate = useNavigate();

  const [username, setUserame] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {loading, handleRegister} = useAuth();

  const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        if (!username.trim() || !email.trim() || !password.trim()) {
            setErrorMessage("Please fill in all fields.");
            return;
        }
        if (password.length < 6) {
            setErrorMessage("Password must be at least 6 characters long.");
            return;
        }
        const result = await handleRegister({username, email, password});
        if (result && result.success) {
            navigate('/');
        } else {
            setErrorMessage(result?.error || "Registration failed. Please try again.");
        }
    }

  return (
    <main className="auth-page"><section className="auth-card"><div className="auth-brand"><Sparkles size={18}/> InterviewAI</div><h1>Create your account</h1><p>Build focused preparation for your next role.</p>
      <form onSubmit={handleSubmit} noValidate>
        <label>Name<input value={username} onChange={(e) => setUserame(e.target.value)} id="username" name="username" autoComplete="username" placeholder="Your name" /></label>
        <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" id="email" name="email" autoComplete="email" placeholder="you@example.com" /></label>
        <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" id="password" name="password" minLength="6" autoComplete="new-password" placeholder="At least 6 characters" /></label>
        {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
        <button className="button button-primary button-block" disabled={loading}>{loading ? "Creating account…" : "Create account"}</button>
      </form><p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
    </section></main>
  );
}

export default Register;
