import { EnrichedCandidate } from '../services/advancedCandidateScoring';

/**
 * Professional AI Prompt Templates
 * Senior prompt engineering for consistent, actionable recruiter insights
 */

export interface RecommendationContext {
  candidates: EnrichedCandidate[];
  jobTitle?: string;
  requiredSkills?: string[];
  jobDescription?: string;
  urgency?: 'high' | 'medium' | 'low';
  budget?: 'entry' | 'mid' | 'senior';
}

export class ProfessionalRecommendationPrompts {
  /**
   * Generate hiring recommendation prompt with structured output
   */
  static buildHiringRecommendationPrompt(context: RecommendationContext): string {
    const { candidates, jobTitle, requiredSkills, urgency } = context;

    return `You are a Senior Technical Recruiter with 15 years of experience in talent acquisition. Analyze these candidates and provide data-driven hiring recommendations.

═══════════════════════════════════════════════════════════
📋 JOB REQUIREMENTS
═══════════════════════════════════════════════════════════
Position: ${jobTitle || 'Not specified - General hiring'}
Required Skills: ${requiredSkills?.join(', ') || 'Not specified'}
Urgency: ${urgency?.toUpperCase() || 'NORMAL'}

═══════════════════════════════════════════════════════════
👥 CANDIDATE POOL (${candidates.length} candidates)
═══════════════════════════════════════════════════════════

${candidates
  .map(
    (c, i) => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANDIDATE ${i + 1}: ${c.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SCORES (0-100):
   • Overall: ${c.scores.overall}
   • Hiring Readiness: ${c.scores.hiringReadiness}
   • Technical: ${c.scores.technical}
   • Education: ${c.scores.education}
   • Experience: ${c.scores.experience}
   • Engagement: ${c.scores.engagement}

🎓 EDUCATION:
   • University: ${c.university}
   • Branch: ${c.branch}
   • CGPA: ${c.cgpa ? `${c.cgpa}/10` : 'Not provided'}
   • Graduation: ${c.graduationYear}

💼 TECHNICAL PROFILE:
   • Skills (${c.totalSkillCount}): ${c.skillCategories.technical.slice(0, 10).join(', ')}${c.skillCategories.technical.length > 10 ? ` +${c.skillCategories.technical.length - 10} more` : ''}
   • Tools: ${c.skillCategories.tools.join(', ') || 'None listed'}
   • Soft Skills: ${c.skillCategories.soft.join(', ') || 'None listed'}
   
📚 PROFESSIONAL DEVELOPMENT:
   • Training Programs: ${c.trainings.length} (${c.trainings
     .slice(0, 2)
     .map((t) => t.title)
     .join(', ')}${c.trainings.length > 2 ? '...' : ''})
   • Certifications: ${c.certificates.length} (${c.certificates
     .slice(0, 2)
     .map((c) => c.name)
     .join(', ')}${c.certificates.length > 2 ? '...' : ''})
   
🌍 LOCATION & AVAILABILITY:
   • Location: ${c.city}, ${c.state}
   • Profile Completeness: ${c.profileCompleteness}%
   • Last Active: ${this.formatLastActive(c.lastActive)}
   • Responsiveness: ${c.responsiveness.toUpperCase()}
   • Applications: ${c.applicationCount} jobs

📱 ONLINE PRESENCE:
   • Resume: ${c.resumeUrl ? '✅ Available' : '❌ Missing'}
   • GitHub: ${c.hasGitHub ? '✅' : '❌'}
   • LinkedIn: ${c.hasLinkedIn ? '✅' : '❌'}
   • Portfolio: ${c.hasPortfolio ? '✅' : '❌'}

✅ GREEN FLAGS:
${c.greenFlags.length > 0 ? c.greenFlags.map((f) => `   ${f}`).join('\n') : '   None identified'}

⚠️ RED FLAGS:
${c.redFlags.length > 0 ? c.redFlags.map((f) => `   ${f}`).join('\n') : '   None identified'}

${
  c.dataQualityIssues.length > 0
    ? `🔍 DATA QUALITY ISSUES:
${c.dataQualityIssues.map((i) => `   ⚠️ ${i}`).join('\n')}`
    : ''
}

`
  )
  .join('\n')}

═══════════════════════════════════════════════════════════
📝 INSTRUCTIONS
═══════════════════════════════════════════════════════════

Provide a comprehensive hiring analysis following this EXACT format:

## 🎯 TOP RECOMMENDATIONS

For the TOP 3 candidates (or fewer if not enough qualify), provide:

### [RANK]. [CANDIDATE NAME] - HIRING RECOMMENDATION: [STRONG HIRE / HIRE / CONDITIONAL HIRE]

**Match Score: [X]/100**

**✅ KEY STRENGTHS:**
• [Specific strength with data]
• [Specific strength with data]
• [Specific strength with data]

**⚠️ CONCERNS & GAPS:**
• [Specific concern or missing skill]
• [Specific concern or missing skill]

**💡 INTERVIEW FOCUS AREAS:**
1. [Specific area to probe - be tactical]
2. [Specific area to probe - be tactical]
3. [Specific area to probe - be tactical]

**📋 IMMEDIATE NEXT STEPS:**
1. [Actionable step with timeline]
2. [Actionable step with timeline]

**⏱️ TIMELINE TO HIRE:** [X days/weeks with justification]

**💰 SALARY EXPECTATION:** [Range based on profile]

---

## 🚨 CANDIDATES TO PASS ON

List candidates who don't meet the bar:

**[NAME]:** [Brief reason - be honest and data-driven]

---

## 📊 COMPARATIVE ANALYSIS

Create a comparison table:

| Criterion | ${candidates
      .slice(0, 3)
      .map((c) => c.name)
      .join(' | ')} |
|-----------|${candidates
      .slice(0, 3)
      .map(() => '---')
      .join('|')}|
| Technical Fit | [Score/10] | [Score/10] | [Score/10] |
| Cultural Fit | [Score/10] | [Score/10] | [Score/10] |
| Risk Level | [LOW/MED/HIGH] | [LOW/MED/HIGH] | [LOW/MED/HIGH] |

---

## ⚡ CRITICAL RECOMMENDATIONS

${urgency === 'high' ? '**⏰ URGENT HIRING MODE ACTIVATED**\n\n' : ''}

1. **PRIORITY ACTION:** [Most critical step to take now]
2. **RISK MITIGATION:** [How to reduce hiring risk]
3. **PIPELINE HEALTH:** [Assessment of overall candidate quality]
${context.requiredSkills && context.requiredSkills.length > 0 ? `4. **SKILL GAP ANALYSIS:** [Which required skills are hard to find?]` : ''}

═══════════════════════════════════════════════════════════

IMPORTANT GUIDELINES:
✓ Be brutally honest - bad hires cost 6-months salary
✓ Flag ALL data quality issues (vague skills, missing info)
✓ Provide specific, actionable recommendations with timelines
✓ Consider: technical fit, cultural fit, learning potential, risk factors
✓ If a candidate has suspicious/vague skills, CALL IT OUT explicitly
✓ Score realistically - not everyone is 80+
✓ Focus on HIRE/NO-HIRE signals, not fluff

BEGIN ANALYSIS:`;
  }

  /**
   * Generate comparison prompt for 2-3 candidates
   */
  static buildCandidateComparisonPrompt(
    candidates: EnrichedCandidate[],
    jobTitle?: string
  ): string {
    return `You are conducting a final-round candidate comparison for hiring decision.

JOB POSITION: ${jobTitle || 'General Position'}

FINALISTS (${candidates.length}):

${candidates
  .map(
    (c, i) => `
═══ CANDIDATE ${i + 1}: ${c.name} ═══

Key Metrics:
• Overall Score: ${c.scores.overall}/100
• Hiring Readiness: ${c.scores.hiringReadiness}/100
• Technical: ${c.scores.technical}/100 | Education: ${c.scores.education}/100

Skills: ${c.skillCategories.technical.join(', ')}
Experience: ${c.trainings.length} trainings, ${c.certificates.length} certifications
Education: ${c.cgpa}/10 CGPA from ${c.university}

Green Flags: ${c.greenFlags.join('; ') || 'None'}
Red Flags: ${c.redFlags.join('; ') || 'None'}

`
  )
  .join('\n')}

Provide a HEAD-TO-HEAD comparison with:

1. **WINNER: [Name]** - [1-2 sentence decisive recommendation]

2. **DETAILED BREAKDOWN:**

| Dimension | ${candidates[0].name} | ${candidates[1]?.name || ''} |${candidates[2]?.name || ''}|
|-----------|-----------|-----------|-----------|
| Technical Skills | [Assessment] | [Assessment] | [Assessment] |
| Learning Agility | [Score/10] | [Score/10] | [Score/10] |
| Culture Fit | [Score/10] | [Score/10] | [Score/10] |
| Risk Factor | [LOW/MED/HIGH] | [LOW/MED/HIGH] | [LOW/MED/HIGH] |
| Time to Productivity | [X weeks] | [X weeks] | [X weeks] |

3. **THE DECISION:**
   • **Hire:** [Name] - [Why they win]
   • **Backup:** [Name] - [Why they're second choice]
   • **Pass:** [Name] - [Honest reason]

4. **NEGOTIATION STRATEGY:**
   • Offer Range: [X - Y based on profile]
   • Negotiation Leverage: [Strong/Moderate/Weak]
   • Key Selling Points: [What excites this candidate]

Be DECISIVE. Provide a clear hire recommendation with data-driven reasoning.`;
  }

  /**
   * Generate skill gap analysis prompt
   */
  static buildSkillGapAnalysisPrompt(
    candidates: EnrichedCandidate[],
    requiredSkills: string[]
  ): string {
    return `Analyze skill gaps across candidate pool.

REQUIRED SKILLS: ${requiredSkills.join(', ')}

CANDIDATES: ${candidates.length}

${candidates
  .map(
    (c) => `
• ${c.name}: ${c.skillCategories.technical.join(', ')}
`
  )
  .join('\n')}

Provide:

1. **SKILL COVERAGE HEATMAP:**
   
   | Skill | Candidates with Skill | Coverage % |
   |-------|----------------------|------------|
   ${requiredSkills.map((skill) => `| ${skill} | [List names] | [X]% |`).join('\n   ')}

2. **CRITICAL GAPS:**
   • [Skill with <30% coverage]: CRITICAL - [Recommendation]
   • [Skill with 30-60% coverage]: MODERATE - [Recommendation]

3. **HIRING STRATEGY:**
   • Option 1: [Hire for skills A, B, C - train on X, Y]
   • Option 2: [Hire junior + senior combination]
   • Option 3: [Upskilling timeline for best candidate]

4. **RISK ASSESSMENT:**
   • Technical Risk: [LOW/MEDIUM/HIGH]
   • Mitigation: [Specific actions]`;
  }

  /**
   * Format last active time
   */
  private static formatLastActive(lastActive: string): string {
    const days = Math.floor(
      (new Date().getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days <= 7) return `${days} days ago`;
    if (days <= 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  }

  /**
   * Generate interview questions based on candidate profile
   */
  static buildInterviewQuestionsPrompt(candidate: EnrichedCandidate, jobRole?: string): string {
    return `Generate targeted interview questions for this candidate.

CANDIDATE: ${candidate.name}
ROLE: ${jobRole || 'General Technical Role'}

CANDIDATE PROFILE:
• Technical Skills: ${candidate.skillCategories.technical.join(', ')}
• Experience: ${candidate.trainings.length} trainings, ${candidate.certificates.length} certs
• CGPA: ${candidate.cgpa || 'Unknown'}
• Red Flags: ${candidate.redFlags.join('; ') || 'None'}

Generate 10 interview questions:

**TECHNICAL DEPTH (4 questions):**
1. [Question targeting specific skill]
2. [Question probing technical understanding]
3. [Question testing problem-solving]
4. [Question evaluating architecture/design thinking]

**EXPERIENCE VALIDATION (3 questions):**
5. [Question about listed training/project]
6. [Question to verify skill depth]
7. [Question about gaps in experience]

**RED FLAG INVESTIGATION (${candidate.redFlags.length} questions):**
${candidate.redFlags.length > 0 ? candidate.redFlags.map((flag, i) => `${8 + i}. [Question addressing: ${flag}]`).join('\n') : '8. [General behavioral question]'}

**CULTURAL FIT (1 question):**
${9 + candidate.redFlags.length}. [Question assessing work style/values]

For each question, provide:
• **Why:** [What you're really testing]
• **Red Flag:** [What answer would concern you]
• **Green Flag:** [What answer would impress you]`;
  }
}

export default ProfessionalRecommendationPrompts;
