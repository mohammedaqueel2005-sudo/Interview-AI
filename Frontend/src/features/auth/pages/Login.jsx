import React, { useState } from 'react';
import '../auth.form.scss';
import { useNavigate, Link } from "react-router";
import { useAuth } from '../hooks/useAuth';

const Login = () => {
    

    const { loading, handleLogin } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");
        if (!email.trim() || !password.trim()) {
            setErrorMessage("Please enter both email and password.");
            return;
        }
        const result = await handleLogin({ email, password });
        if (result && result.success) {
            navigate('/');
        } else {
            setErrorMessage(result?.error || "Login failed. Please check your credentials.");
        }
    }

    if(loading) {
        return (
            <main><h1>Loading.....</h1></main>
        )
    }

  return (
    <main>
        <div className="form-container">
            <h1>Login</h1>
            {errorMessage && (
                <div style={{
                    backgroundColor: "rgba(255, 45, 120, 0.15)",
                    border: "1px solid #ff2d78",
                    color: "#ff8ab2",
                    padding: "0.75rem",
                    borderRadius: "6px",
                    marginBottom: "1rem",
                    fontSize: "0.9rem"
                }}>
                    {errorMessage}
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input
                    onChange={(e) => { setEmail(e.target.value) }} 
                    type="email" id='email' name='email' placeholder='Enter email address' />
                </div>

                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input
                    onChange={(e)=>{ setPassword(e.target.value) }} 
                    type="password" id='password' name='password' placeholder='Enter Password' />
                </div>

                <button className='button primary-button'>Login</button>
            </form>

            <p>Don't have an account? <Link to={'/register'}>Register</Link></p>
        </div>
    </main>
  );
}

export default Login;
