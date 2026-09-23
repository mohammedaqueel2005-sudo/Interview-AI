import React, { useState, useEffect } from 'react';
import '../styles/interview.scss';
import { useInterview } from '../hooks/useInterview.js';
import { useNavigate, useParams, Link } from 'react-router';

const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
    { id: 'skills', label: 'Skills & Gap Analysis', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>) }
];

// ── Interactive Question Card with Practice Mode & Explainability ──────────────
const QuestionCard = ({ item, index, questionType = "technical", interviewId, onEvaluate }) => {
    const [ open, setOpen ] = useState(false);
    const [ practiceOpen, setPracticeOpen ] = useState(false);
    const [ userAnswer, setUserAnswer ] = useState("");
    const [ evaluating, setEvaluating ] = useState(false);
    const [ assessment, setAssessment ] = useState(null);
    const [ evalError, setEvalError ] = useState("");

    const handleAssess = async () => {
        if (!userAnswer.trim()) {
            setEvalError("Please type your answer before submitting for evaluation.");
            return;
        }
        setEvalError("");
        setEvaluating(true);

        const result = await onEvaluate({
            interviewId,
            questionIndex: index,
            questionText: item.question,
            userAnswer: userAnswer.trim(),
            questionType
        });

        setEvaluating(false);
        if (result.success) {
            setAssessment(result.assessment);
        } else {
            setEvalError(result.error || "Failed to evaluate answer. Please try again.");
        }
    };

    const difficultyBadgeClass = item.difficulty === "hard" 
        ? "badge--hard" 
        : item.difficulty === "easy" 
            ? "badge--easy" 
            : "badge--medium";

    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <div className='q-card__title-row'>
                    <span className='q-card__index'>Q{index + 1}</span>
                    {item.difficulty && (
                        <span className={`badge-difficulty ${difficultyBadgeClass}`}>{item.difficulty}</span>
                    )}
                    {item.source && (
                        <span className='badge-source'>{item.source}</span>
                    )}
                    {item.skill && (
                        <span className='badge-skill'>{item.skill}</span>
                    )}
                </div>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>

            {open && (
                <div className='q-card__body'>
                    {/* Explainability Section */}
                    {item.reason && (
                        <div className='q-card__section q-card__section--explain'>
                            <span className='q-card__tag q-card__tag--why'>Why this question?</span>
                            <p className='q-card__explain-text'>{item.reason}</p>
                        </div>
                    )}

                    {/* Interviewer Intention */}
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Interviewer Intention</span>
                        <p>{item.intention}</p>
                    </div>

                    {/* Expected Topics (if technical) */}
                    {item.expectedTopics && item.expectedTopics.length > 0 && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--topics'>Expected Key Concepts</span>
                            <div className='topics-list'>
                                {item.expectedTopics.map((topic, i) => (
                                    <span key={i} className='topic-chip'>{topic}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Model Answer */}
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Reference Model Answer</span>
                        <p className='model-answer-text'>{item.answer}</p>
                    </div>

                    {/* Follow up questions */}
                    {item.followUpQuestions && item.followUpQuestions.length > 0 && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--followup'>Possible Follow-ups</span>
                            <ul className='followup-list'>
                                {item.followUpQuestions.map((fq, i) => (
                                    <li key={i}>{fq}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* STAR Tips (if behavioral) */}
                    {item.starTips && item.starTips.length > 0 && (
                        <div className='q-card__section'>
                            <span className='q-card__tag q-card__tag--star'>STAR Strategy Tips</span>
                            <ul className='followup-list'>
                                {item.starTips.map((tip, i) => (
                                    <li key={i}>{tip}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Interactive Practice Mode Accordion */}
                    <div className='practice-box'>
                        <button 
                            type="button"
                            className='practice-toggle-btn'
                            onClick={() => setPracticeOpen(p => !p)}
                        >
                            <span>{practiceOpen ? "▲ Hide Practice Mode" : "🎙️ Practice Your Answer & Get AI Feedback"}</span>
                        </button>

                        {practiceOpen && (
                            <div className='practice-area'>
                                <label className='practice-label'>Type or draft your answer to this question:</label>
                                <textarea
                                    className='practice-textarea'
                                    placeholder="Write your answer here as if you are in the real interview..."
                                    rows={5}
                                    value={userAnswer}
                                    onChange={(e) => { setUserAnswer(e.target.value); if (evalError) setEvalError(""); }}
                                />
                                {evalError && <p className='practice-error'>{evalError}</p>}
                                <div className='practice-actions'>
                                    <button 
                                        type="button" 
                                        className='button primary-button evaluate-btn'
                                        onClick={handleAssess}
                                        disabled={evaluating}
                                    >
                                        {evaluating ? "Evaluating Answer..." : "Submit for AI Assessment"}
                                    </button>
                                </div>

                                {/* Assessment Results Display */}
                                {assessment && (
                                    <div className='assessment-card'>
                                        <div className='assessment-header'>
                                            <h4>AI Evaluation Result</h4>
                                            <div className={`score-badge score--${assessment.score >= 7 ? 'high' : assessment.score >= 5 ? 'mid' : 'low'}`}>
                                                {assessment.score} / 10
                                            </div>
                                        </div>

                                        <div className='metric-bars'>
                                            <div className='metric-row'>
                                                <span>Technical Accuracy</span>
                                                <div className='metric-bar-bg'><div className='metric-bar-fill' style={{ width: `${assessment.technicalAccuracy}%` }}></div></div>
                                                <span className='metric-val'>{assessment.technicalAccuracy}%</span>
                                            </div>
                                            <div className='metric-row'>
                                                <span>Communication &amp; Structure</span>
                                                <div className='metric-bar-bg'><div className='metric-bar-fill' style={{ width: `${assessment.communication}%` }}></div></div>
                                                <span className='metric-val'>{assessment.communication}%</span>
                                            </div>
                                        </div>

                                        {assessment.strengths && assessment.strengths.length > 0 && (
                                            <div className='feedback-block feedback-block--strengths'>
                                                <strong>Strengths:</strong>
                                                <ul>
                                                    {assessment.strengths.map((s, idx) => (
                                                        <li key={idx}>{s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {assessment.missingPoints && assessment.missingPoints.length > 0 && (
                                            <div className='feedback-block feedback-block--missing'>
                                                <strong>Missing Concepts &amp; Trade-offs:</strong>
                                                <ul>
                                                    {assessment.missingPoints.map((m, idx) => (
                                                        <li key={idx}>{m}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {assessment.improvementSuggestions && assessment.improvementSuggestions.length > 0 && (
                                            <div className='feedback-block feedback-block--suggestions'>
                                                <strong>How to Improve:</strong>
                                                <ul>
                                                    {assessment.improvementSuggestions.map((tip, idx) => (
                                                        <li key={idx}>{tip}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {assessment.betterAnswer && (
                                            <div className='better-answer-box'>
                                                <strong>Refined Answer Example:</strong>
                                                <p>{assessment.betterAnswer}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Interactive Roadmap Day with Checkable Tasks ──────────────────────────────
const RoadMapDay = ({ day }) => {
    const [ completedTasks, setCompletedTasks ] = useState({});

    const toggleTask = (index) => {
        setCompletedTasks(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const completedCount = Object.values(completedTasks).filter(Boolean).length;
    const totalCount = day.tasks ? day.tasks.length : 0;

    return (
        <div className='roadmap-day'>
            <div className='roadmap-day__header'>
                <div className='roadmap-badges'>
                    <span className='roadmap-day__badge'>Day {day.day}</span>
                    {day.priority && (
                        <span className={`priority-tag priority-tag--${day.priority}`}>{day.priority}</span>
                    )}
                </div>
                <h3 className='roadmap-day__focus'>{day.focus}</h3>
                {day.reason && <p className='roadmap-day__reason'>{day.reason}</p>}
                <span className='task-progress-badge'>{completedCount} / {totalCount} completed</span>
            </div>
            <ul className='roadmap-day__tasks'>
                {day.tasks.map((task, i) => (
                    <li 
                        key={i} 
                        className={`task-item ${completedTasks[i] ? 'task-item--done' : ''}`}
                        onClick={() => toggleTask(i)}
                    >
                        <input 
                            type="checkbox" 
                            checked={!!completedTasks[i]} 
                            onChange={() => {}} // Handled by li click
                            className='task-checkbox'
                        />
                        <span className='task-text'>{task}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [ activeNav, setActiveNav ] = useState('technical');
    const { report, getReportById, loading, getResumePdf, evaluateAnswer, pdfLoading, pdfError } = useInterview();
    const { interviewId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId);
        }
    }, [ interviewId ]);

    if (loading || !report) {
        return (
            <main className='loading-screen'>
                <h1>Loading your interview plan...</h1>
            </main>
        );
    }

    const skillAnalysis = report.skillsAnalysis || report.skillAnalysis || {};
    const matchedSkills = skillAnalysis.matchedSkills || [];
    const missingSkills = skillAnalysis.missingSkills || [];
    const verifiedStrengths = skillAnalysis.verifiedStrengths || report.verifiedStrengths || [];
    const gaps = report.skillGaps || [];
    const roadmap = (report.roadmap && report.roadmap.length > 0) ? report.roadmap : (report.preparationPlan || []);
    const isInsufficientData = skillAnalysis.status === "insufficient_data" || (skillAnalysis.requiredSkillCount === 0 && (!skillAnalysis.preferredSkills || skillAnalysis.preferredSkills.length === 0));

    const scoreColor = isInsufficientData ? 'score--low' :
        report.matchScore >= 80 ? 'score--high' :
            report.matchScore >= 60 ? 'score--mid' : 'score--low';

    return (
        <div className='interview-page'>
            {/* Top Navigation */}
            <header className='interview-header-bar'>
                <button onClick={() => navigate('/')} className='back-btn'>
                    ← Back to Dashboard
                </button>
                <div className='header-title'>
                    <h1>{report.title || "Interview Preparation"}</h1>
                    <span className='created-date'>Generated on {new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
                <button
                    onClick={() => { getResumePdf(interviewId); }}
                    className={`button primary-button download-top-btn ${pdfLoading ? 'download-top-btn--loading' : ''}`}
                    disabled={pdfLoading}
                    title={pdfError || 'Download a tailored resume PDF for this role'}
                >
                    {pdfLoading ? (
                        <>
                            <span className='pdf-spinner' />
                            Generating Resume...
                        </>
                    ) : (
                        <>
                            <svg height={"0.85rem"} style={{ marginRight: "0.5rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956Z"></path></svg>
                            Download Tailored Resume
                        </>
                    )}
                </button>
            </header>
            {pdfError && (
                <div className='pdf-error-banner'>
                    <span>⚠️ {pdfError}</span>
                </div>
            )}

            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav'>
                    <div className="nav-content">
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className='deterministic-score-summary'>
                        <span className='score-label'>Deterministic Match</span>
                        <div className={`score-badge ${scoreColor}`}>
                            {isInsufficientData ? "N/A" : `${report.matchScore}%`}
                        </div>
                        <p className='score-subtext'>
                            {isInsufficientData 
                                ? "Unable to calculate match — no JD requirements were extracted."
                                : `${skillAnalysis.matchedSkillCount || 0} of ${skillAnalysis.requiredSkillCount || 0} core requirements matched`}
                        </p>
                    </div>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <div>
                                    <h2>Technical Questions</h2>
                                    <p className='content-header__subtitle'>Tailored to your verified stack, target JD, and identified gaps with full explainability.</p>
                                </div>
                                <span className='content-header__count'>{report.technicalQuestions?.length || 0} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.technicalQuestions?.map((q, i) => (
                                    <QuestionCard 
                                        key={i} 
                                        item={q} 
                                        index={i} 
                                        questionType="technical"
                                        interviewId={interviewId}
                                        onEvaluate={evaluateAnswer}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <div>
                                    <h2>Behavioral Questions</h2>
                                    <p className='content-header__subtitle'>Situational questions with STAR guidelines tailored to role expectations.</p>
                                </div>
                                <span className='content-header__count'>{report.behavioralQuestions?.length || 0} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.behavioralQuestions?.map((q, i) => (
                                    <QuestionCard 
                                        key={i} 
                                        item={q} 
                                        index={i} 
                                        questionType="behavioral"
                                        interviewId={interviewId}
                                        onEvaluate={evaluateAnswer}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <div>
                                    <h2>Personalized Preparation Road Map</h2>
                                    <p className='content-header__subtitle'>Step-by-step checklist prioritizing critical skill gaps and key project review.</p>
                                </div>
                                <span className='content-header__count'>{roadmap.length}-day plan</span>
                            </div>
                            <div className='roadmap-list'>
                                {roadmap.length > 0 ? (
                                    roadmap.map((day) => (
                                        <RoadMapDay key={day.day} day={day} />
                                    ))
                                ) : (
                                    <div className='empty-state-box'>
                                        <p className='empty-state-text'>Personalized roadmap could not be generated. Please ensure a detailed job description is provided.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {activeNav === 'skills' && (
                        <section className='skills-analysis-section'>
                            <div className='content-header'>
                                <div>
                                    <h2>Deterministic Skills &amp; Gap Analysis</h2>
                                    <p className='content-header__subtitle'>Calculated strictly by normalized code matching — not estimated by LLM.</p>
                                </div>
                            </div>

                            {/* Matched Skills */}
                            <div className='analysis-group'>
                                <h3>Matched Skills ({matchedSkills.length})</h3>
                                <p className='analysis-desc'>Technologies identified in both your candidate profile and the target job description:</p>
                                <div className='matched-tags-list'>
                                    {matchedSkills.length > 0 ? (
                                        matchedSkills.map((s, idx) => (
                                            <span key={idx} className='matched-tag'>✓ {s}</span>
                                        ))
                                    ) : (
                                        <p className='empty-state-text'>
                                            {isInsufficientData ? "Unable to match skills — no JD requirements extracted." : "No direct core skills matched yet."}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Missing Skills & Gaps */}
                            <div className='analysis-group'>
                                <h3>Identified Skill Gaps ({gaps.length})</h3>
                                <p className='analysis-desc'>Requirements from the job description not verified in your profile:</p>
                                <div className='gaps-table'>
                                    {gaps.length > 0 ? (
                                        gaps.map((gap, idx) => (
                                            <div key={idx} className={`gap-card gap-card--${gap.severity}`}>
                                                <div className='gap-header'>
                                                    <span className='gap-name'>{gap.skill}</span>
                                                    <span className={`gap-severity-badge severity--${gap.severity}`}>
                                                        {gap.severity} priority
                                                    </span>
                                                </div>
                                                {gap.category && <span className='gap-category'>{gap.category}</span>}
                                                <p className='gap-reason'>{gap.reason}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className='empty-state-text'>
                                            {isInsufficientData ? "No job requirements could be extracted from the job description." : "No critical skill gaps identified — strong alignment with JD requirements."}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>

                    {/* Match Score */}
                    <div className='match-score'>
                        <p className='match-score__label'>Deterministic Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className='match-score__value'>{isInsufficientData ? "N/A" : report.matchScore}</span>
                            {!isInsufficientData && <span className='match-score__pct'>%</span>}
                        </div>
                        <p className='match-score__sub'>
                            {isInsufficientData ? 'No JD requirements extracted' :
                             report.matchScore >= 80 ? 'Strong alignment with role requirements' :
                             report.matchScore >= 60 ? 'Moderate match with addressable gaps' : 'Developing candidate for this role'}
                        </p>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Skill Gaps Summary */}
                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Prioritized Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {gaps.slice(0, 8).map((gap, i) => (
                                <span 
                                    key={i} 
                                    className={`skill-tag skill-tag--${gap.severity}`}
                                    title={gap.reason}
                                >
                                    {gap.skill}
                                </span>
                            ))}
                            {gaps.length === 0 && (
                                <p className='empty-state-text' style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                    {isInsufficientData ? "No requirements to compare" : "No critical gaps identified"}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Matched Summary */}
                    <div className='matched-summary-box'>
                        <p className='skill-gaps__label'>Verified Strengths</p>
                        <div className='matched-chips-list'>
                            {verifiedStrengths.slice(0, 8).map((skill, i) => (
                                <span key={i} className='verified-skill-chip'>✓ {skill}</span>
                            ))}
                            {verifiedStrengths.length === 0 && (
                                <p className='empty-state-text' style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                    {isInsufficientData ? "None identified" : "None identified yet"}
                                </p>
                            )}
                        </div>
                    </div>

                </aside>
            </div>
        </div>
    );
};

export default Interview;