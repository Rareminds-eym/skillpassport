/**
 * Print View Component
 * Professional PDF layout optimized for A4 (210mm x 297mm)
 * Margins: 15mm, Content area: ~180mm x 267mm
 * Now supports different grade levels: middle, highschool, after12
 */
const PrintView = ({ results, studentInfo, gradeLevel = 'after12', riasecNames, traitNames }) => {
    if (!results) {
        return (
            <div className="print-view">
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <p>No results available for printing.</p>
                </div>
            </div>
        );
    }

    const { riasec, aptitude, bigFive, workValues, employability, knowledge, careerFit, skillGap, roadmap, finalNote } = results;

    // Determine if this is a simplified assessment (middle/high school)
    // Check both gradeLevel prop AND presence of profileSnapshot (which only exists for middle/high school)
    const isSimplifiedAssessment =
        gradeLevel === 'middle' ||
        gradeLevel === 'highschool' ||
        (results.profileSnapshot && (results.profileSnapshot.aptitudeStrengths || results.profileSnapshot.keyPatterns));

    // Default student info if not provided
    const safeStudentInfo = {
        name: studentInfo?.name || '—',
        regNo: studentInfo?.regNo || '—',
        college: studentInfo?.college || '—',
        stream: studentInfo?.stream || '—'
    };
    
    // Default career interest names if not provided
    const safeRiasecNames = riasecNames || {
        R: 'Realistic',
        I: 'Investigative',
        A: 'Artistic',
        S: 'Social',
        E: 'Enterprising',
        C: 'Conventional'
    };
    
    // Default trait names if not provided
    const safeTraitNames = traitNames || {
        O: 'Openness',
        C: 'Conscientiousness',
        E: 'Extraversion',
        A: 'Agreeableness',
        N: 'Neuroticism'
    };

    // Helper to get score color
    const getScoreStyle = (pct) => {
        if (pct >= 70) return { bg: '#dcfce7', color: '#166534', border: '#86efac' };
        if (pct >= 40) return { bg: '#fef9c3', color: '#854d0e', border: '#fde047' };
        return { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' };
    };

    const styles = {
        page: {
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '10px',
            lineHeight: '1.4',
            color: '#1f2937',
            padding: '0',
            marginBottom: '20px',
        },
        lastPage: {
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '10px',
            lineHeight: '1.4',
            color: '#1f2937',
            padding: '0',
        },
        header: {
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            color: 'white',
            padding: '12px 16px',
            marginBottom: '20px',
        },
        headerTitle: {
            fontSize: '22px',
            fontWeight: 'bold',
            margin: '0 0 4px 0',
        },
        headerSubtitle: {
            fontSize: '11px',
            color: '#94a3b8',
            margin: '0',
        },
        infoGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginBottom: '20px',
        },
        infoBox: {
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '10px 12px',
        },
        infoLabel: {
            fontSize: '9px',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            margin: '0 0 2px 0',
        },
        infoValue: {
            fontSize: '11px',
            fontWeight: '600',
            color: '#1e293b',
            margin: '0',
        },
        sectionTitle: {
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#1e293b',
            borderBottom: '2px solid #4f46e5',
            paddingBottom: '6px',
            marginTop: '20px',
            marginBottom: '12px',
        },
        subTitle: {
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#374151',
            marginTop: '14px',
            marginBottom: '8px',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '12px',
            fontSize: '10px',
        },
        th: {
            background: '#f1f5f9',
            padding: '8px 10px',
            border: '1px solid #e2e8f0',
            textAlign: 'left',
            fontWeight: '600',
            color: '#475569',
        },
        td: {
            padding: '8px 10px',
            border: '1px solid #e2e8f0',
            verticalAlign: 'top',
        },
        card: {
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '10px',
            background: '#fafafa',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
        },
        badge: {
            display: 'inline-block',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '9px',
            fontWeight: '600',
        },
        summaryBox: {
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '6px',
            padding: '12px 15px',
            marginTop: '15px',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
        },
        finalBox: {
            background: '#1e293b',
            color: 'white',
            borderRadius: '6px',
            padding: '15px 20px',
            marginTop: '20px',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
        },
        progressBar: {
            height: '6px',
            background: '#e5e7eb',
            borderRadius: '3px',
            overflow: 'hidden',
            marginTop: '4px',
        },
        twoCol: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
        },
    };

    return (
        <div className="print-view" style={{ background: 'white', position: 'relative' }}>
            {/* Rareminds Bulb Logo Watermark - Center - PRINT ONLY */}
            <div className="print-only-watermark" style={{
                position: 'fixed', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)', 
                pointerEvents: 'none', 
                zIndex: 0,
                opacity: 0.08
            }}>
                <img 
                    src="/RMLogo.webp" 
                    alt="Rareminds Watermark" 
                    style={{
                        width: '400px', 
                        height: '400px', 
                        objectFit: 'contain'
                    }} 
                />
            </div>
            
            {/* Additional Logo Watermarks for Pattern - PRINT ONLY */}
            <div className="print-only-watermark" style={{
                position: 'fixed',
                top: '20%',
                left: '20%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 0,
                opacity: 0.05
            }}>
                <img 
                    src="/RMLogo.webp" 
                    alt="Rareminds Watermark" 
                    style={{
                        width: '200px', 
                        height: '200px', 
                        objectFit: 'contain'
                    }} 
                />
            </div>
            
            <div className="print-only-watermark" style={{
                position: 'fixed',
                top: '20%',
                right: '10%',
                transform: 'translate(50%, -50%)',
                pointerEvents: 'none',
                zIndex: 0,
                opacity: 0.05
            }}>
                <img 
                    src="/RMLogo.webp" 
                    alt="Rareminds Watermark" 
                    style={{
                        width: '200px', 
                        height: '200px', 
                        objectFit: 'contain'
                    }} 
                />
            </div>
            
            <div className="print-only-watermark" style={{
                position: 'fixed',
                bottom: '15%',
                left: '20%',
                transform: 'translate(-50%, 50%)',
                pointerEvents: 'none',
                zIndex: 0,
                opacity: 0.05
            }}>
                <img 
                    src="/RMLogo.webp" 
                    alt="Rareminds Watermark" 
                    style={{
                        width: '200px', 
                        height: '200px', 
                        objectFit: 'contain'
                    }} 
                />
            </div>
            
            <div className="print-only-watermark" style={{
                position: 'fixed',
                bottom: '15%',
                right: '10%',
                transform: 'translate(50%, 50%)',
                pointerEvents: 'none',
                zIndex: 0,
                opacity: 0.05
            }}>
                <img 
                    src="/RMLogo.webp" 
                    alt="Rareminds Watermark" 
                    style={{
                        width: '200px', 
                        height: '200px', 
                        objectFit: 'contain'
                    }} 
                />
            </div>

            {/* Fixed Footer - appears on every page */}
            <div className="print-footer" style={{position: 'fixed', bottom: 0, left: 0, right: 0, padding: '10px 15mm', background: 'white', borderTop: '2px solid #4f46e5', zIndex: 9999}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <img src="/RareMinds%20ISO%20Logo-01.png" alt="Rareminds" style={{width: '90px', height: '56px', objectFit: 'contain'}} />
                        <div>
                            <p style={{margin: '0', fontSize: '9px', fontWeight: 'bold', color: '#1e293b'}}>RAREMINDS SkillPassport • AI-Powered Career Assessment</p>
                            <p style={{margin: '0', fontSize: '7px', color: '#6b7280'}}>This is a digitally generated report, does not need signature</p>
                        </div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                        <p style={{margin: '0', fontSize: '7px', color: '#6b7280'}}>Report Generated: {new Date().toLocaleDateString()}</p>
                        <p style={{margin: '0', fontSize: '7px', color: '#9ca3af'}}>Confidential • For Student Use Only</p>
                    </div>
                </div>
            </div>
            
            {/* Continuous Content */}
            <div className="print-content" style={{position: 'relative', zIndex: 1, paddingBottom: '70px'}}>
                {/* Header with Branding */}
                <div style={styles.header}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                            <img src="/RareMinds%20ISO%20Logo-01.png" alt="Rareminds" style={{width: '144px', height: '88px', objectFit: 'contain'}} />
                            <div style={{paddingLeft: '15px'}}>
                                <h1 style={styles.headerTitle}>RAREMINDS SkillPassport • AI-Powered Career Assessment</h1>
                            </div>
                        </div>
                        <div style={{textAlign: 'right'}}>
                            <p style={{margin: '0', fontSize: '12px', fontWeight: 'bold', color: 'white'}}>Career Assessment Report</p>
                        </div>
                    </div>
                </div>

                {/* Student Info Grid */}
                <div style={styles.infoGrid}>
                    <div style={styles.infoBox}>
                        <p style={styles.infoLabel}>Student Name</p>
                        <p style={styles.infoValue}>{safeStudentInfo.name}</p>
                    </div>
                    <div style={styles.infoBox}>
                        <p style={styles.infoLabel}>Register No.</p>
                        <p style={styles.infoValue}>{safeStudentInfo.regNo}</p>
                    </div>
                    <div style={styles.infoBox}>
                        <p style={styles.infoLabel}>Programme</p>
                        <p style={styles.infoValue}>{safeStudentInfo.stream}</p>
                    </div>
                    <div style={styles.infoBox}>
                        <p style={styles.infoLabel}>College</p>
                        <p style={styles.infoValue}>{safeStudentInfo.college}</p>
                    </div>
                    <div style={styles.infoBox}>
                        <p style={styles.infoLabel}>Assessment Date</p>
                        <p style={styles.infoValue}>{new Date().toLocaleDateString()}</p>
                    </div>
                    <div style={styles.infoBox}>
                        <p style={styles.infoLabel}>Assessor</p>
                        <p style={styles.infoValue}>SkillPassport AI</p>
                    </div>
                </div>

                {/* Data Privacy Notice */}
                <div style={{background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '10px 12px', marginBottom: '20px', fontSize: '8px', color: '#0c4a6e', lineHeight: '1.5'}}>
                    <p style={{margin: '0'}}><strong>Data Privacy & Consent:</strong> By submitting this form, you consent to the collection and processing of the information you provide for the purpose stated. Your data will be stored securely, used only for authorised activities, and will not be shared with third parties without your explicit permission unless required by law. You may request access, correction, or deletion of your data at any time.</p>
                </div>

                {/* Section 1: Profile Snapshot */}
                <h2 style={styles.sectionTitle}>1. Student Profile Snapshot</h2>

                {/* For all grade levels: Interest Profile */}
                <div style={isSimplifiedAssessment ? {} : styles.twoCol}>
                    {/* Interest Profile */}
                    <div>
                        <h3 style={styles.subTitle}>{isSimplifiedAssessment ? 'Interest Explorer Results' : 'Interest Profile'}</h3>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Rank</th>
                                    <th style={styles.th}>Interest Type</th>
                                    <th style={{...styles.th, textAlign: 'center'}}>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {riasec?.topThree?.map((code, idx) => {
                                    const score = riasec.scores?.[code] || 0;
                                    const maxScore = riasec.maxScore || 20;
                                    const pct = Math.round((score / maxScore) * 100);
                                    const scoreStyle = getScoreStyle(pct);
                                    return (
                                        <tr key={code}>
                                            <td style={styles.td}>#{idx + 1}</td>
                                            <td style={styles.td}><strong>{safeRiasecNames[code]}</strong> ({code})</td>
                                            <td style={{...styles.td, textAlign: 'center'}}>
                                                <span style={{...styles.badge, background: scoreStyle.bg, color: scoreStyle.color}}>{score}/{maxScore}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <p style={{fontSize: '9px', color: '#6b7280', fontStyle: 'italic', margin: '0'}}>{riasec?.interpretation}</p>
                    </div>

                    {/* Cognitive Abilities - Only for after12 (college students with MCQ tests) */}
                    {!isSimplifiedAssessment && aptitude?.scores && (
                    <div>
                        <h3 style={styles.subTitle}>Cognitive Abilities</h3>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Domain</th>
                                    <th style={{...styles.th, textAlign: 'center'}}>Score</th>
                                    <th style={{...styles.th, textAlign: 'center'}}>%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(aptitude.scores).map(([domain, data]) => {
                                    const pct = data.percentage || 0;
                                    const scoreStyle = getScoreStyle(pct);
                                    return (
                                        <tr key={domain}>
                                            <td style={{...styles.td, textTransform: 'capitalize'}}>{domain}</td>
                                            <td style={{...styles.td, textAlign: 'center'}}>{data.correct}/{data.total}</td>
                                            <td style={{...styles.td, textAlign: 'center'}}>
                                                <span style={{...styles.badge, background: scoreStyle.bg, color: scoreStyle.color}}>{pct}%</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <p style={{fontSize: '9px', margin: '4px 0 0 0'}}><strong>Strengths:</strong> {aptitude?.topStrengths?.join(', ')}</p>
                    </div>
                    )}
                </div>

                {/* For after12 only: Big Five, Work Values, Knowledge */}
                {!isSimplifiedAssessment && (
                <div style={{...styles.twoCol, marginTop: '15px'}}>
                    {/* Personality */}
                    <div>
                        <h3 style={styles.subTitle}>Personality Traits (Big Five)</h3>
                        <table style={styles.table}>
                            <tbody>
                                {['O', 'C', 'E', 'A', 'N'].map(trait => {
                                    const score = bigFive?.[trait] || 0;
                                    const pct = (score / 5) * 100;
                                    const scoreStyle = getScoreStyle(pct);
                                    return (
                                        <tr key={trait}>
                                            <td style={{...styles.td, width: '50%'}}>{safeTraitNames[trait]}</td>
                                            <td style={{...styles.td, width: '25%'}}>
                                                <div style={styles.progressBar}>
                                                    <div style={{height: '100%', width: `${pct}%`, background: scoreStyle.border, borderRadius: '3px'}}></div>
                                                </div>
                                            </td>
                                            <td style={{...styles.td, textAlign: 'center', width: '25%'}}>
                                                <span style={{...styles.badge, background: scoreStyle.bg, color: scoreStyle.color}}>{score.toFixed(1)}/5</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <p style={{fontSize: '9px', color: '#6b7280', fontStyle: 'italic', margin: '0'}}>{bigFive?.workStyleSummary}</p>
                    </div>

                    {/* Work Values & Knowledge */}
                    <div>
                        <h3 style={styles.subTitle}>Top Work Values</h3>
                        {workValues?.topThree?.map((val, idx) => {
                            const pct = (val.score / 5) * 100;
                            const scoreStyle = getScoreStyle(pct);
                            return (
                                <div key={idx} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9'}}>
                                    <span>#{idx + 1} {val.value}</span>
                                    <span style={{...styles.badge, background: scoreStyle.bg, color: scoreStyle.color}}>{val.score}/5</span>
                                </div>
                            );
                        })}

                        <h3 style={{...styles.subTitle, marginTop: '12px'}}>Knowledge Assessment</h3>
                        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                            <span style={{...styles.badge, background: getScoreStyle(knowledge?.score || 0).bg, color: getScoreStyle(knowledge?.score || 0).color, fontSize: '12px', padding: '6px 12px'}}>
                                {knowledge?.score || 0}%
                            </span>
                            <span style={{fontSize: '10px', color: '#6b7280'}}>{knowledge?.correctCount}/{knowledge?.totalQuestions} correct</span>
                        </div>
                    </div>
                </div>
                )}

                {/* Character Strengths - ONLY for middle/high school */}
                {isSimplifiedAssessment && results.profileSnapshot?.aptitudeStrengths && (
                <div style={{marginTop: '15px'}}>
                    <h3 style={styles.subTitle}>Character Strengths & Personal Qualities</h3>
                    {results.profileSnapshot.aptitudeStrengths.map((strength, idx) => (
                        <div key={idx} style={styles.card}>
                            <h4 style={{margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold', color: '#4f46e5'}}>{strength.name}</h4>
                            <p style={{margin: '0', fontSize: '9px', color: '#4b5563'}}>{strength.description}</p>
                        </div>
                    ))}
                </div>
                )}

                {/* Learning & Work Style - ONLY for middle/high school */}
                {isSimplifiedAssessment && results.profileSnapshot?.keyPatterns && (
                <div style={{...styles.twoCol, marginTop: '15px'}}>
                    <div style={styles.card}>
                        <h4 style={{margin: '0 0 6px 0', fontSize: '11px', fontWeight: 'bold', color: '#1e293b'}}>What You Enjoy</h4>
                        <p style={{margin: '0', fontSize: '9px'}}>{results.profileSnapshot.keyPatterns.enjoyment}</p>
                    </div>
                    <div style={styles.card}>
                        <h4 style={{margin: '0 0 6px 0', fontSize: '11px', fontWeight: 'bold', color: '#1e293b'}}>How You Work Best</h4>
                        <p style={{margin: '0', fontSize: '9px'}}>{results.profileSnapshot.keyPatterns.workStyle}</p>
                    </div>
                    <div style={styles.card}>
                        <h4 style={{margin: '0 0 6px 0', fontSize: '11px', fontWeight: 'bold', color: '#1e293b'}}>Your Strengths</h4>
                        <p style={{margin: '0', fontSize: '9px'}}>{results.profileSnapshot.keyPatterns.strength}</p>
                    </div>
                    <div style={styles.card}>
                        <h4 style={{margin: '0 0 6px 0', fontSize: '11px', fontWeight: 'bold', color: '#1e293b'}}>What Motivates You</h4>
                        <p style={{margin: '0', fontSize: '9px'}}>{results.profileSnapshot.keyPatterns.motivation}</p>
                    </div>
                </div>
                )}

                {/* Overall Summary - For all grade levels */}
                {results.overallSummary && (
                <div style={styles.summaryBox}>
                    <p style={{margin: '0', fontSize: '10px'}}><strong>Overall Summary:</strong> {results.overallSummary}</p>
                </div>
                )}

                {/* Section 2: Career Exploration - ONLY for middle/high school */}
                {isSimplifiedAssessment && careerFit && (
                <>
                <h2 style={{...styles.sectionTitle, marginTop: '30px'}}>2. Career Exploration</h2>

                {careerFit?.clusters?.map((cluster, idx) => {
                    const scoreStyle = getScoreStyle(cluster.matchScore || 0);
                    return (
                        <div key={idx} style={{...styles.card, borderLeft: `4px solid ${scoreStyle.border}`}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px'}}>
                                <div>
                                    <h4 style={{margin: '0 0 4px 0', fontSize: '12px', fontWeight: 'bold'}}>{cluster.title}</h4>
                                    <span style={{...styles.badge, background: scoreStyle.bg, color: scoreStyle.color}}>{cluster.fit} Match • {cluster.matchScore}%</span>
                                </div>
                            </div>
                            <p style={{fontSize: '9px', color: '#4b5563', margin: '6px 0'}}>{cluster.summary}</p>
                            {cluster.roles?.entry && (
                                <div style={{fontSize: '9px', marginTop: '8px'}}>
                                    <strong>Example Careers:</strong> {cluster.roles.entry.join(', ')}
                                </div>
                            )}
                        </div>
                    );
                })}

                <h3 style={styles.subTitle}>Career Ideas to Explore</h3>
                <div style={styles.twoCol}>
                    <div>
                        <h4 style={{fontSize: '10px', fontWeight: 'bold', color: '#166534', margin: '0 0 6px 0'}}>Strong Matches</h4>
                        {careerFit?.specificOptions?.highFit?.map((career, i) => (
                            <div key={i} style={{padding: '3px 0', fontSize: '9px'}}>• {career}</div>
                        ))}
                    </div>
                    <div>
                        <h4 style={{fontSize: '10px', fontWeight: 'bold', color: '#854d0e', margin: '0 0 6px 0'}}>Also Consider</h4>
                        {careerFit?.specificOptions?.mediumFit?.map((career, i) => (
                            <div key={i} style={{padding: '3px 0', fontSize: '9px'}}>• {career}</div>
                        ))}
                    </div>
                </div>
                </>
                )}

                {/* Section 3: Skills to Develop - ONLY for middle/high school */}
                {isSimplifiedAssessment && skillGap && (
                <>
                <h2 style={{...styles.sectionTitle, marginTop: '30px'}}>3. Skills to Develop</h2>

                {skillGap?.currentStrengths && skillGap.currentStrengths.length > 0 && (
                    <div>
                        <h3 style={styles.subTitle}>Your Current Strengths</h3>
                        <div style={styles.card}>
                            {skillGap.currentStrengths.map((s, i) => (
                                <div key={i} style={{padding: '4px 0', fontSize: '9px', borderBottom: i < skillGap.currentStrengths.length - 1 ? '1px solid #f1f5f9' : 'none'}}>
                                    <span style={{color: '#166534', marginRight: '6px'}}>✓</span> {s}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <h3 style={styles.subTitle}>Priority Skills to Build (Next 6 Months)</h3>
                {skillGap?.priorityA?.map((item, idx) => (
                    <div key={idx} style={{...styles.card, padding: '10px'}}>
                        <div style={{marginBottom: '6px'}}>
                            <strong style={{fontSize: '11px', color: '#1e293b'}}>{idx + 1}. {item.skill}</strong>
                            {item.targetLevel && (
                                <span style={{...styles.badge, background: '#dcfce7', color: '#166534', marginLeft: '8px'}}>
                                    Target: {item.targetLevel}
                                </span>
                            )}
                        </div>
                        <p style={{margin: '0', fontSize: '9px', color: '#4b5563'}}><strong>Why this matters:</strong> {item.reason || item.whyNeeded}</p>
                    </div>
                ))}

                {skillGap?.priorityB && skillGap.priorityB.length > 0 && (
                    <>
                        <h3 style={styles.subTitle}>Additional Skills to Explore (6-12 Months)</h3>
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
                            {skillGap.priorityB.map((item, idx) => (
                                <span key={idx} style={{...styles.badge, background: '#fef9c3', color: '#854d0e'}}>
                                    {typeof item === 'string' ? item : item.skill}
                                </span>
                            ))}
                        </div>
                    </>
                )}

                {skillGap?.recommendedTrack && (
                    <div style={{...styles.summaryBox, marginTop: '15px'}}>
                        <p style={{margin: '0'}}><strong>Your Learning Path:</strong> {skillGap.recommendedTrack}</p>
                    </div>
                )}
                </>
                )}

                {/* Section 4: 12-Month Journey - ONLY for middle/high school */}
                {isSimplifiedAssessment && roadmap?.twelveMonthJourney && (
                <>
                <h2 style={{...styles.sectionTitle, marginTop: '30px'}}>4. Your 12-Month Journey</h2>

                {Object.entries(roadmap.twelveMonthJourney).map(([phaseKey, phase], idx) => (
                    <div key={phaseKey} style={{...styles.card, background: idx % 2 === 0 ? '#f0f9ff' : '#fefce8', border: 'none'}}>
                        <h4 style={{margin: '0 0 6px 0', fontSize: '12px', fontWeight: 'bold', color: '#1e293b'}}>
                            {phase.months}: {phase.title}
                        </h4>
                        <p style={{margin: '4px 0', fontSize: '9px'}}><strong>Goals:</strong> {phase.goals?.join(', ')}</p>
                        <p style={{margin: '4px 0', fontSize: '9px'}}><strong>Activities:</strong> {phase.activities?.join(', ')}</p>
                        <p style={{margin: '0', fontSize: '9px', color: '#166534'}}><strong>Outcome:</strong> {phase.outcome}</p>
                    </div>
                ))}
                </>
                )}

                {/* Projects to Try - ONLY for middle/high school */}
                {isSimplifiedAssessment && roadmap?.projects && roadmap.projects.length > 0 && (
                <>
                <h3 style={{...styles.subTitle, marginTop: '20px'}}>Projects to Try</h3>
                {roadmap.projects.map((project, idx) => (
                    <div key={idx} style={styles.card}>
                        <h4 style={{margin: '0 0 6px 0', fontSize: '11px', color: '#4f46e5'}}>
                            Project {idx + 1}: {project.title}
                        </h4>
                        <p style={{margin: '4px 0', fontSize: '9px'}}>{project.description}</p>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px', fontSize: '9px'}}>
                            <div><strong>Timeline:</strong> {project.timeline}</div>
                            <div><strong>Level:</strong> {project.difficulty}</div>
                        </div>
                        {project.steps && (
                            <div style={{marginTop: '6px', fontSize: '9px'}}>
                                <strong>Steps:</strong>
                                {project.steps.map((step, i) => (
                                    <div key={i} style={{paddingLeft: '10px', padding: '2px 0'}}>• {step}</div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                </>
                )}

                {/* Activities & Exposure - ONLY for middle/high school */}
                {isSimplifiedAssessment && roadmap?.exposure && (
                <div style={{...styles.twoCol, marginTop: '15px'}}>
                    {roadmap.exposure.activities && roadmap.exposure.activities.length > 0 && (
                        <div style={styles.card}>
                            <h4 style={{margin: '0 0 6px 0', fontSize: '11px', fontWeight: 'bold'}}>Activities to Join</h4>
                            {roadmap.exposure.activities.map((activity, i) => (
                                <div key={i} style={{fontSize: '9px', padding: '2px 0'}}>• {activity}</div>
                            ))}
                        </div>
                    )}
                    {roadmap.exposure.certifications && roadmap.exposure.certifications.length > 0 && (
                        <div style={styles.card}>
                            <h4 style={{margin: '0 0 6px 0', fontSize: '11px', fontWeight: 'bold'}}>Certificates to Earn</h4>
                            {roadmap.exposure.certifications.map((cert, i) => (
                                <div key={i} style={{fontSize: '9px', padding: '2px 0'}}>• {cert}</div>
                            ))}
                        </div>
                    )}
                </div>
                )}

                {/* Final Note - For middle/high school */}
                {isSimplifiedAssessment && finalNote && (
                <div style={styles.finalBox}>
                    <h3 style={{margin: '0 0 10px 0', fontSize: '12px', color: '#fbbf24'}}>Message for You</h3>
                    <p style={{margin: '0 0 6px 0', fontSize: '10px'}}>
                        <strong style={{color: '#86efac'}}>Your Biggest Strength:</strong> {finalNote.advantage}
                    </p>
                    <p style={{margin: '0', fontSize: '10px'}}>
                        <strong style={{color: '#fde047'}}>Your Next Step:</strong> {finalNote.growthFocus}
                    </p>
                </div>
                )}

                {/* Report Disclaimer - For middle/high school */}
                {isSimplifiedAssessment && (
                <div style={{background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '6px', padding: '10px 12px', marginTop: '15px', marginBottom: '30px', fontSize: '8px', color: '#78350f', lineHeight: '1.5'}}>
                    <p style={{margin: '0'}}><strong>Report Disclaimer:</strong> This career report is generated by Rareminds using the inputs and assessment data shared by the user. Your information has been processed confidentially and in compliance with applicable data protection norms, and is not shared with any external parties.</p>
                </div>
                )}

                {/* Section 2: Career Fit Analysis - ONLY for after12 */}
                {!isSimplifiedAssessment && careerFit && (
                <>
                <h2 style={{...styles.sectionTitle, marginTop: '30px'}}>2. Career Fit Analysis</h2>

                {careerFit?.clusters?.map((cluster, idx) => {
                    const scoreStyle = getScoreStyle(cluster.matchScore || 0);
                    return (
                        <div key={idx} style={{...styles.card, borderLeft: `4px solid ${scoreStyle.border}`}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px'}}>
                                <div>
                                    <h4 style={{margin: '0 0 4px 0', fontSize: '12px', fontWeight: 'bold'}}>{cluster.title}</h4>
                                    <span style={{...styles.badge, background: scoreStyle.bg, color: scoreStyle.color}}>{cluster.fit} Fit • {cluster.matchScore}% Match</span>
                                </div>
                            </div>
                            {cluster.evidence && (
                                <div style={{fontSize: '9px', color: '#4b5563', marginBottom: '8px'}}>
                                    <p style={{margin: '2px 0'}}><strong>Interest:</strong> {cluster.evidence.interest}</p>
                                    <p style={{margin: '2px 0'}}><strong>Aptitude:</strong> {cluster.evidence.aptitude}</p>
                                    <p style={{margin: '2px 0'}}><strong>Personality:</strong> {cluster.evidence.personality}</p>
                                </div>
                            )}
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '9px'}}>
                                <div>
                                    <strong>Entry Roles:</strong> {cluster.roles?.entry?.join(', ') || 'N/A'}
                                </div>
                                <div style={{textAlign: 'right'}}>
                                    <strong>Mid Roles:</strong> {cluster.roles?.mid?.join(', ') || 'N/A'}
                                </div>
                            </div>
                        </div>
                    );
                })}

                <h3 style={styles.subTitle}>Career Options by Fit Level</h3>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={{...styles.th, background: '#dcfce7', color: '#166534'}}>High Fit</th>
                            <th style={{...styles.th, background: '#fef9c3', color: '#854d0e'}}>Medium Fit</th>
                            <th style={{...styles.th, background: '#fee2e2', color: '#991b1b'}}>Explore Later</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{...styles.td, verticalAlign: 'top'}}>
                                {careerFit?.specificOptions?.highFit?.map((r, i) => <div key={i} style={{padding: '2px 0'}}>• {r}</div>)}
                            </td>
                            <td style={{...styles.td, verticalAlign: 'top'}}>
                                {careerFit?.specificOptions?.mediumFit?.map((r, i) => <div key={i} style={{padding: '2px 0'}}>• {r}</div>)}
                            </td>
                            <td style={{...styles.td, verticalAlign: 'top'}}>
                                {careerFit?.specificOptions?.exploreLater?.map((r, i) => <div key={i} style={{padding: '2px 0'}}>• {r}</div>)}
                            </td>
                        </tr>
                    </tbody>
                </table>
                </>
                )}

                {/* Section 3: Skill Gap & Development Plan - ONLY for after12 */}
                {!isSimplifiedAssessment && skillGap && (
                <>
                <h2 style={{...styles.sectionTitle, marginTop: '30px'}}>3. Skill Gap & Development Plan</h2>

                <div style={styles.twoCol}>
                    <div>
                        <h3 style={styles.subTitle}>Current Strengths</h3>
                        <div style={styles.card}>
                            {skillGap?.currentStrengths?.map((s, i) => (
                                <div key={i} style={{padding: '4px 0', borderBottom: i < skillGap.currentStrengths.length - 1 ? '1px solid #f1f5f9' : 'none'}}>
                                    <span style={{color: '#166534'}}>✓</span> {s}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 style={styles.subTitle}>Employability Assessment</h3>
                        <div style={styles.card}>
                            <p style={{margin: '0 0 6px 0', fontSize: '9px'}}><strong style={{color: '#166534'}}>Strong Areas:</strong> {employability?.strengthAreas?.join(', ')}</p>
                            <p style={{margin: '0', fontSize: '9px'}}><strong style={{color: '#dc2626'}}>Improve:</strong> {employability?.improvementAreas?.join(', ') || 'None identified'}</p>
                        </div>
                    </div>
                </div>

                <h3 style={styles.subTitle}>Priority A Skills (Build in 6 months)</h3>
                {skillGap?.priorityA?.map((item, idx) => {
                    const currentPct = (item.currentLevel / 5) * 100;
                    const targetPct = (item.targetLevel / 5) * 100;
                    return (
                        <div key={idx} style={{...styles.card, padding: '10px'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
                                <strong style={{fontSize: '11px'}}>{idx + 1}. {item.skill}</strong>
                                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                    <span style={{...styles.badge, background: getScoreStyle(currentPct).bg, color: getScoreStyle(currentPct).color}}>{item.currentLevel}/5</span>
                                    <span style={{fontSize: '10px'}}>→</span>
                                    <span style={{...styles.badge, background: '#dcfce7', color: '#166534'}}>{item.targetLevel}/5</span>
                                </div>
                            </div>
                            <p style={{margin: '4px 0', fontSize: '9px'}}><strong>Why:</strong> {item.whyNeeded}</p>
                            <p style={{margin: '0', fontSize: '9px'}}><strong>How:</strong> {item.howToBuild}</p>
                        </div>
                    );
                })}

                <h3 style={styles.subTitle}>Priority B Skills (6-12 months)</h3>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
                    {skillGap?.priorityB?.map((item, idx) => (
                        <span key={idx} style={{...styles.badge, background: '#fef9c3', color: '#854d0e'}}>{item.skill}</span>
                    ))}
                </div>

                <div style={{...styles.summaryBox, marginTop: '15px'}}>
                    <p style={{margin: '0'}}><strong>Recommended Learning Track:</strong> {skillGap?.recommendedTrack}</p>
                </div>
                </>
                )}
            </div>

            {/* PAGE 4: Roadmap - ONLY for after12 */}
            {!isSimplifiedAssessment && roadmap && (
            <div style={styles.lastPage}>
                {/* Page Header with Watermark */}
                <div style={{position: 'relative', marginBottom: '15px'}}>
                    {/* Watermark */}
                    <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)', fontSize: '48px', fontWeight: 'bold', color: 'rgba(79, 70, 229, 0.03)', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 0}}>
                        RAREMINDS SkillPassport
                    </div>
                    
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0', position: 'relative', zIndex: 1}}>
                        <span style={{fontSize: '9px', color: '#6b7280'}}>Career Assessment Report • {safeStudentInfo.name}</span>
                        <span style={{fontSize: '9px', color: '#4f46e5', fontWeight: '600'}}>RAREMINDS SkillPassport • AI-Powered Career Assessment</span>
                    </div>
                </div>
                <h2 style={styles.sectionTitle}>4. 6-12 Month Action Roadmap</h2>

                <h3 style={styles.subTitle}>Portfolio Projects</h3>
                <div style={styles.twoCol}>
                    {roadmap?.projects?.map((project, idx) => (
                        <div key={idx} style={styles.card}>
                            <h4 style={{margin: '0 0 6px 0', fontSize: '11px', color: '#4f46e5'}}>Project {idx + 1}: {project.title}</h4>
                            <p style={{margin: '2px 0', fontSize: '9px'}}><strong>Purpose:</strong> {project.purpose}</p>
                            <p style={{margin: '0', fontSize: '9px'}}><strong>Output:</strong> {project.output}</p>
                        </div>
                    ))}
                </div>

                <div style={styles.twoCol}>
                    <div>
                        <h3 style={styles.subTitle}>Internship Pathway</h3>
                        <div style={styles.card}>
                            <p style={{margin: '0 0 4px 0', fontSize: '9px'}}><strong>Types:</strong> {roadmap?.internship?.types?.join(', ')}</p>
                            <p style={{margin: '0 0 4px 0', fontSize: '9px'}}><strong>Timeline:</strong> {roadmap?.internship?.timeline}</p>
                            <p style={{margin: '0 0 4px 0', fontSize: '9px'}}><strong>Resume:</strong> {roadmap?.internship?.preparation?.resume}</p>
                            <p style={{margin: '0 0 4px 0', fontSize: '9px'}}><strong>Portfolio:</strong> {roadmap?.internship?.preparation?.portfolio}</p>
                            <p style={{margin: '0', fontSize: '9px'}}><strong>Interview:</strong> {roadmap?.internship?.preparation?.interview}</p>
                        </div>
                    </div>
                    <div>
                        <h3 style={styles.subTitle}>Activities & Certifications</h3>
                        <div style={styles.card}>
                            <p style={{margin: '0 0 6px 0', fontSize: '9px'}}><strong>Join/Lead:</strong></p>
                            {roadmap?.exposure?.activities?.map((a, i) => (
                                <div key={i} style={{fontSize: '9px', padding: '2px 0'}}>• {a}</div>
                            ))}
                            <p style={{margin: '8px 0 4px 0', fontSize: '9px'}}><strong>Certifications:</strong></p>
                            {roadmap?.exposure?.certifications?.map((c, i) => (
                                <div key={i} style={{fontSize: '9px', padding: '2px 0'}}>• {c}</div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Final Note */}
                <div style={styles.finalBox}>
                    <h3 style={{margin: '0 0 10px 0', fontSize: '12px', color: '#fbbf24'}}>Final Counselor Note</h3>
                    <p style={{margin: '0 0 6px 0', fontSize: '10px'}}><strong style={{color: '#86efac'}}>Your Biggest Advantage:</strong> {finalNote?.advantage}</p>
                    <p style={{margin: '0 0 6px 0', fontSize: '10px'}}><strong style={{color: '#fde047'}}>Top Growth Focus:</strong> {finalNote?.growthFocus}</p>
                    <p style={{margin: '0', fontSize: '10px'}}><strong style={{color: '#93c5fd'}}>Next Review:</strong> {finalNote?.nextReview || 'End of 5th Semester'}</p>
                </div>

                {/* Report Disclaimer */}
                <div style={{background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '6px', padding: '10px 12px', marginTop: '15px', marginBottom: '30px', fontSize: '8px', color: '#78350f', lineHeight: '1.5'}}>
                    <p style={{margin: '0'}}><strong>Report Disclaimer:</strong> This career report is generated by Rareminds using the inputs and assessment data shared by the user. Your information has been processed confidentially and in compliance with applicable data protection norms, and is not shared with any external parties.</p>
                </div>
            </div>
            )}
        </div>
    );
};

export default PrintView;
