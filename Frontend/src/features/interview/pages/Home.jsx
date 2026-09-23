import React, { useState, useRef, useEffect } from 'react';
import "../styles/Home.scss";
import { useInterview } from '../hooks/useInterview.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { useNavigate } from 'react-router';

const LOADING_STEPS = [
    { title: "Extracting Candidate Profile", desc: "Parsing resume and self-description into structured entities..." },
    { title: "Analyzing Job Requirements", desc: "Extracting core technical requirements, frameworks, and expectations..." },
    { title: "Deterministic Skill Gap Matching", desc: "Normalizing skills and calculating deterministic match percentage..." },
    { title: "Formulating Personalized Strategy", desc: "Generating explainable questions, STAR tips, and a step-by-step roadmap..." }
];

const Home = () => {
    const { loading, generateReport, reports } = useInterview();
    const { user, handleLogout } = useAuth();
    const [ jobDescription, setJobDescription ] = useState("");
    const [ selfDescription, setSelfDescription ] = useState("");
    const [ selectedFile, setSelectedFile ] = useState(null);
    const [ errorMessage, setErrorMessage ] = useState("");
    const [ activeStep, setActiveStep ] = useState(0);

    const resumeInputRef = useRef();
    const navigate = useNavigate();

    // Multi-stage animated loading progress simulator
    useEffect(() => {
        let interval = null;
        if (loading) {
            setActiveStep(0);
            interval = setInterval(() => {
                setActiveStep(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
            }, 6000);
        } else {
            setActiveStep(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [loading]);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setErrorMessage("");
        }
    };

    const handleRemoveFile = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedFile(null);
        if (resumeInputRef.current) {
            resumeInputRef.current.value = "";
        }
    };

    const handleGenerateReport = async () => {
        setErrorMessage("");

        if (!jobDescription.trim() || jobDescription.trim().length < 20) {
            setErrorMessage("Please paste a detailed Job Description (minimum 20 characters) so our system can analyze requirements.");
            return;
        }

        if (!selectedFile && !selfDescription.trim()) {
            setErrorMessage("Please either upload a Resume PDF or provide a brief Self Description.");
            return;
        }

        const result = await generateReport({
            jobDescription: jobDescription.trim(),
            selfDescription: selfDescription.trim(),
            resumeFile: selectedFile
        });

        if (result && result.success && result.interviewReport) {
            navigate(`/interview/${result.interviewReport._id}`);
        } else {
            setErrorMessage(result?.error || "Failed to generate interview preparation. Please try again.");
        }
    };

    if (loading) {
        return (
            <main className='loading-screen'>
                <div className='loading-card'>
                    <div className='loading-spinner-wrapper'>
                        <div className='spinner-ring'></div>
                        <span className='spinner-icon'>⚡</span>
                    </div>
                    <h2>Building Your Strategic Interview Plan</h2>
                    <p className='loading-subtitle'>Our AI is performing deterministic skill matching and generating targeted practice material.</p>

                    <div className='progress-pipeline'>
                        {LOADING_STEPS.map((step, idx) => (
                            <div 
                                key={idx} 
                                className={`pipeline-step ${idx <= activeStep ? 'pipeline-step--active' : ''} ${idx < activeStep ? 'pipeline-step--done' : ''}`}
                            >
                                <div className='step-indicator'>
                                    {idx < activeStep ? '✓' : idx + 1}
                                </div>
                                <div className='step-details'>
                                    <h4>{step.title}</h4>
                                    <p>{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <div className='home-page'>
            {/* Top Navigation Bar */}
            <nav className='app-navbar'>
                <div className='brand'>
                    <span className='brand-icon'>🎯</span>
                    <span className='brand-title'>Interview <strong>AI</strong></span>
                </div>
                <div className='user-controls'>
                    {user && (
                        <>
                            <span className='user-greeting'>Welcome, <strong>{user.username}</strong></span>
                            <button 
                                onClick={handleLogout} 
                                className='logout-button'
                                title="Sign out of your account"
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </nav>

            {/* Page Header */}
            <header className='page-header'>
                <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                <p>AI extracts requirements, matches skills deterministically, and designs an explainable interview strategy tailored to your exact profile.</p>
            </header>

            {/* Error Banner */}
            {errorMessage && (
                <div className='error-banner'>
                    <span className='error-icon'>⚠️</span>
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Main Card */}
            <div className='interview-card'>
                <div className='interview-card__body'>

                    {/* Left Panel - Job Description */}
                    <div className='panel panel--left'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                            </span>
                            <h2>Target Job Description</h2>
                            <span className='badge badge--required'>Required</span>
                        </div>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => { setJobDescription(e.target.value); if (errorMessage) setErrorMessage(""); }}
                            className='panel__textarea'
                            placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, state management, and large-scale web performance...'`}
                            maxLength={5000}
                        />
                        <div className='char-counter'>
                            {jobDescription.length} / 5000 chars
                        </div>
                    </div>

                    {/* Vertical Divider */}
                    <div className='panel-divider' />

                    {/* Right Panel - Profile */}
                    <div className='panel panel--right'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume */}
                        <div className='upload-section'>
                            <label className='section-label'>
                                Upload Resume
                                <span className='badge badge--best'>Best Results</span>
                            </label>

                            {selectedFile ? (
                                <div className='file-preview-card'>
                                    <div className='file-info'>
                                        <span className='file-icon'>📄</span>
                                        <div>
                                            <p className='file-name'>{selectedFile.name}</p>
                                            <p className='file-meta'>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB &bull; Ready for extraction</p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={handleRemoveFile} 
                                        className='remove-file-btn'
                                        title="Remove file"
                                    >
                                        ✕ Remove
                                    </button>
                                </div>
                            ) : (
                                <label className='dropzone' htmlFor='resume'>
                                    <span className='dropzone__icon'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                                    </span>
                                    <p className='dropzone__title'>Click to upload or drag &amp; drop</p>
                                    <p className='dropzone__subtitle'>PDF format (Max 5MB)</p>
                                    <input 
                                        ref={resumeInputRef} 
                                        hidden 
                                        type='file' 
                                        id='resume' 
                                        name='resume' 
                                        accept='.pdf' 
                                        onChange={handleFileChange}
                                    />
                                </label>
                            )}
                        </div>

                        {/* OR Divider */}
                        <div className='or-divider'><span>OR</span></div>

                        {/* Quick Self-Description */}
                        <div className='self-description'>
                            <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                            <textarea
                                value={selfDescription}
                                onChange={(e) => { setSelfDescription(e.target.value); if (errorMessage) setErrorMessage(""); }}
                                id='selfDescription'
                                name='selfDescription'
                                className='panel__textarea panel__textarea--short'
                                placeholder="Briefly describe your core skills, years of experience, and main stack if you don't have a resume handy..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className='info-box'>
                            <span className='info-box__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" /></svg>
                            </span>
                            <p>Either a <strong>Resume PDF</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                        </div>
                    </div>
                </div>

                {/* Card Footer */}
                <div className='interview-card__footer'>
                    <span className='footer-info'>Deterministic Skill Matching &bull; Grounded AI Strategy</span>
                    <button
                        onClick={handleGenerateReport}
                        className='generate-btn'
                        disabled={jobDescription.trim().length < 20}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                        Generate My Interview Strategy
                    </button>
                </div>
            </div>

            {/* Recent Reports List */}
            {reports && reports.length > 0 && (
                <section className='recent-reports'>
                    <h2>My Recent Interview Plans</h2>
                    <ul className='reports-list'>
                        {reports.map(reportItem => (
                            <li 
                                key={reportItem._id} 
                                className='report-item' 
                                onClick={() => navigate(`/interview/${reportItem._id}`)}
                            >
                                <div className='report-item-header'>
                                    <h3>{reportItem.title || 'Untitled Position'}</h3>
                                    <span className={`match-badge ${reportItem.matchScore >= 80 ? 'score--high' : reportItem.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>
                                        {reportItem.matchScore}% Match
                                    </span>
                                </div>
                                <p className='report-meta'>Created on {new Date(reportItem.createdAt).toLocaleDateString()}</p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Page Footer */}
            <footer className='page-footer'>
                <span>Interview AI Platform &bull; Built with Gemini 2.5 &amp; Deterministic Skill Logic</span>
            </footer>
        </div>
    );
};

export default Home;