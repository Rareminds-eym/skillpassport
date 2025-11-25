import { RecruiterContext } from '../types';
import { ParsedRecruiterQuery } from '../services/queryParser';

/**
 * Advanced Prompt Engineering for Recruiter AI
 * 
 * Senior-level prompt engineering with:
 * - Context-aware prompts
 * - Role-specific instructions
 * - Dynamic prompt composition
 * - Chain-of-thought reasoning
 * - Few-shot examples for better outputs
 */

export class AdvancedPromptBuilder {
  
  /**
   * Build master system prompt for recruiter AI with full context
   */
  static buildMasterSystemPrompt(context: RecruiterContext): string {
    return `# ROLE & IDENTITY
You are an Elite AI Recruitment Intelligence Assistant for ${context.name} at ${context.company}.
You are expert in talent acquisition, candidate assessment, and data-driven hiring decisions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RECRUITER CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Name: ${context.name}
• Company: ${context.company}
• Department: ${context.department || 'Cross-functional'}
• Active Opportunities: ${context.active_jobs}
• Candidate Pool: ${context.total_candidates} candidates
• Focus Areas: ${context.specializations.join(', ') || 'General Talent Acquisition'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 CORE CAPABILITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **INTELLIGENT CANDIDATE DISCOVERY**
   - Multi-dimensional skill matching (exact + semantic + transferable)
   - Holistic candidate assessment (skills + training + certifications + academics + projects)
   - Hidden talent identification (high potential but incomplete profiles)
   - Diversity-aware recommendations

2. **PRECISION MATCHING ALGORITHMS**
   - Explainable match scores with breakdown
   - Skill gap analysis with traihability assessment
   - Experience level calibration
   - Location and availability filtering
   - Profile quality scoring

3. **ACTIONABLE INSIGHTS**
   - Data-driven recommendations with reasoning
   - Risk assessment for pipeline candidates
   - Bottleneck identification in hiring process
   - Time-to-hire optimization suggestions
   - Market intelligence and competitive analysis

4. **PROACTIVE INTELLIGENCE**
   - Anticipate recruiter needs from context
   - Suggest alternative search strategies
   - Identify pipeline gaps before they become critical
   - Recommend sourcing strategies for hard-to-fill roles

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 COMMUNICATION PRINCIPLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**CLARITY & DIRECTNESS**
- Lead with key insight (executive summary first)
- Use concrete numbers, not vague descriptions
- Example: "8 candidates match 80%+ requirements" NOT "several good matches"

**EXPLAINABILITY**
- Always explain WHY a candidate is recommended
- Show reasoning: "Strong match because: 5/6 required skills, 3 certifications, 8.5 CGPA"
- Acknowledge limitations: "Limited data on X, recommend direct screening"

**PRIORITIZATION**
- Rank by actionability and impact
- Highlight urgent items first
- Use clear priority indicators: 🔴 High | 🟡 Medium | 🟢 Low

**HONESTY & BALANCE**
- Show both strengths AND gaps
- Example: "Strong technical skills (React, Node.js) but no AWS experience (trainable)"
- Never oversell weak candidates

**ACTIONABILITY**
- Provide 2-3 specific next steps
- Make actions concrete: "Schedule phone screening with Sarah for Tuesday"
- Not vague: "Consider reviewing candidates"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 RESPONSE STRUCTURE (When providing analysis)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **EXECUTIVE SUMMARY** (1-2 sentences)
   → Bottom-line answer to recruiter's query

2. **KEY FINDINGS** (Top 3-5 insights)
   → Most important discoveries ranked by relevance

3. **DETAILED BREAKDOWN** (if requested)
   → Candidate lists, metrics, comparisons

4. **RECOMMENDATIONS** (2-3 actions)
   → Specific, immediate next steps

5. **CONTEXT NOTE** (optional)
   → Additional considerations, caveats, alternatives

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚖️ ETHICAL STANDARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Evaluate on merit: skills, experience, potential ONLY
- Never consider: age, gender, demographics
- Flag if sample size is too small for reliable insights
- Recommend broadening criteria if filtering is too narrow
- Promote diversity by highlighting varied backgrounds
- AI recommends, humans decide (you are an advisor, not decision-maker)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 INTERPRETATION GUIDELINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Skill Matching Philosophy:**
- Required skills: Must-have for role success
- Preferred skills: Nice-to-have, not dealbreakers
- Related skills: Adjacent technologies (React → JavaScript, Python → Data Science)
- Trainable gaps: Skills learnable in 1-3 months (AWS for someone with cloud basics)
- Critical gaps: Skills requiring 6+ months or fundamentals

**Profile Quality Scoring:**
- 90-100%: Complete, verified, multiple credentials
- 75-89%: Strong profile with some missing elements
- 60-74%: Decent profile but needs more data
- <60%: Incomplete, risky without additional validation

**Match Score Interpretation:**
- 85-100%: 🌟 Excellent match - Fast-track to interview
- 70-84%: ✅ Strong candidate - Recommend screening call
- 55-69%: 💡 Good potential - Assess trainability
- 40-54%: ⚡ Moderate fit - Consider for junior roles
- <40%: ❌ Low match - Explore alternative roles

You are a trusted strategic partner. Be confident but humble. Be helpful but never misleading.`;
  }

  /**
   * Build candidate search prompt with parsed query understanding
   */
  static buildCandidateSearchPrompt(
    parsedQuery: ParsedRecruiterQuery,
    candidates: any[],
    context: RecruiterContext
  ): string {
    const skillsSection = parsedQuery.required_skills.length > 0
      ? `\n**REQUIRED SKILLS:** ${parsedQuery.required_skills.join(', ')}`
      : '';
    
    const preferredSection = parsedQuery.preferred_skills.length > 0
      ? `\n**PREFERRED SKILLS:** ${parsedQuery.preferred_skills.join(', ')}`
      : '';

    const filtersSection = this.buildFiltersSection(parsedQuery);

    return `# CANDIDATE SEARCH REQUEST

**ORIGINAL QUERY:** "${parsedQuery.original_query}"
**INTENT:** ${parsedQuery.intent}
**URGENCY:** ${parsedQuery.urgency}
${skillsSection}
${preferredSection}
${filtersSection}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SEARCH RESULTS: ${candidates.length} candidates found
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${this.formatCandidatesForPrompt(candidates, parsedQuery)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyze these candidates and provide:

1. **Executive Summary**: Overall assessment of search results quality
2. **Top 5 Recommendations**: Best candidates ranked with match scores and reasoning
3. **Skill Gap Analysis**: Common missing skills across top candidates
4. **Next Actions**: 2-3 specific steps for ${context.name} to take

Format your response clearly with headers and bullet points.
Use emojis sparingly for visual hierarchy (🌟 for top matches only).`;
  }

  /**
   * Build opportunity matching prompt
   */
  static buildOpportunityMatchingPrompt(
    opportunity: any,
    candidates: any[]
  ): string {
    return `# OPPORTUNITY MATCHING REQUEST

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💼 OPPORTUNITY DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Title:** ${opportunity.job_title || opportunity.title}
**Company:** ${opportunity.company_name}
**Location:** ${opportunity.location}
**Type:** ${opportunity.employment_type}
**Experience:** ${opportunity.experience_required || 'Not specified'}

**Required Skills:**
${Array.isArray(opportunity.skills_required) ? opportunity.skills_required.join(', ') : 'Not specified'}

**Description:**
${opportunity.description || 'No description provided'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 MATCHING CANDIDATES: ${candidates.length} found
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${this.formatCandidatesForPrompt(candidates, {
  required_skills: Array.isArray(opportunity.skills_required) ? opportunity.skills_required : [],
  preferred_skills: [],
  experience_level: 'any',
  locations: [],
  intent: 'match_to_job',
  urgency: 'medium',
  original_query: '',
  confidence_score: 1
})}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Perform intelligent matching and provide:

1. **Match Quality Overview**: How well does the candidate pool match this opportunity?
2. **Top 10 Candidates**: Ranked with match scores (0-100) and detailed reasoning
   - For each candidate, show:
     * Match score with breakdown
     * Matched skills
     * Missing skills (categorized as trainable vs. critical)
     * Additional strengths
     * Interview readiness assessment
     * Recommended next step

3. **Hiring Strategy**: Based on match quality, suggest approach:
   - If strong matches (80%+): Fast-track interview process
   - If moderate matches (60-79%): Screen and assess trainability
   - If weak matches (<60%): Expand search or adjust requirements

4. **Next Actions**: Immediate steps to move forward`;
  }

  /**
   * Build pipeline analysis prompt
   */
  static buildPipelineAnalysisPrompt(pipelineData: any): string {
    return `# RECRUITMENT PIPELINE ANALYSIS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PIPELINE OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Total Candidates:** ${pipelineData.overview.total_candidates}
**Active Candidates:** ${pipelineData.overview.active_candidates}
**Avg Time to Hire:** ${pipelineData.overview.avg_time_to_hire} days
**Conversion Rate:** ${pipelineData.overview.overall_conversion_rate}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 STAGE BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${pipelineData.stage_metrics.map((stage: any) => `
**${stage.stage.toUpperCase()}**
• Candidates: ${stage.count}
• Avg Days: ${stage.avg_days_in_stage}
• Conversion: ${stage.conversion_rate}%
• Drop-off: ${stage.drop_off_rate}%
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ IDENTIFIED BOTTLENECKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${pipelineData.bottlenecks.length > 0 
  ? pipelineData.bottlenecks.map((b: any) => `
**${b.stage.toUpperCase()}** [${b.impact.toUpperCase()} IMPACT]
Issue: ${b.issue}
Recommendation: ${b.recommendation}
`).join('\n')
  : 'No significant bottlenecks detected - pipeline is healthy!'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 AT-RISK CANDIDATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${pipelineData.at_risk_candidates.slice(0, 5).map((c: any) => `
• **${c.candidate_name}** (${c.current_stage})
  Risk: ${c.risk_level.toUpperCase()} | Days in stage: ${c.days_in_current_stage}
  ${c.recommendation}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SUCCESS PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${pipelineData.success_patterns.length > 0
  ? pipelineData.success_patterns.map((p: string) => `• ${p}`).join('\n')
  : '• Not enough data yet to identify patterns'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provide strategic analysis and recommendations:

1. **Pipeline Health Assessment**: Overall evaluation (Excellent/Good/Needs Improvement/Critical)
2. **Critical Issues**: Top 3 issues requiring immediate attention
3. **Optimization Recommendations**: Specific actions to improve pipeline efficiency
4. **Candidate Action Items**: Which candidates need immediate follow-up and why`;
  }

  /**
   * Build skill gap analysis prompt
   */
  static buildSkillGapAnalysisPrompt(
    jobRequirements: string[],
    candidateSkills: Map<string, number>
  ): string {
    const topSkills = Array.from(candidateSkills.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    return `# SKILL GAP ANALYSIS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 JOB REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${jobRequirements.join(', ')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 TALENT POOL SKILLS (Top 15)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${topSkills.map(([skill, count]) => `• ${skill}: ${count} candidates`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyze the gap between requirements and available talent:

1. **Coverage Analysis**: Which required skills are well-covered vs. scarce?
2. **Critical Gaps**: Skills with low availability that are essential
3. **Alternative Skills**: Related skills that could substitute
4. **Sourcing Strategy**: Where to find candidates with missing skills
5. **Training Opportunity**: Which gaps could be filled through training?`;
  }

  /**
   * Helper: Format candidates for prompt
   */
  private static formatCandidatesForPrompt(
    candidates: any[],
    parsedQuery: ParsedRecruiterQuery
  ): string {
    return candidates.slice(0, 15).map((c, idx) => {
      const matchScore = this.calculateQuickMatchScore(c, parsedQuery);
      
      return `
${idx + 1}. **${c.name}** ${matchScore >= 80 ? '🌟' : matchScore >= 65 ? '✅' : ''}
   • Skills: ${c.skills.slice(0, 6).join(', ')}${c.skills.length > 6 ? ` +${c.skills.length - 6} more` : ''}
   • Institution: ${c.institution || 'N/A'}
   • CGPA: ${c.cgpa || 'N/A'}
   • Training: ${c.training_count} | Certifications: ${c.experience_count}
   • Location: ${c.location || 'Not specified'}
   • Profile: ${c.profile_completeness || 'N/A'}%
   • Match: ~${matchScore}%`;
    }).join('\n');
  }

  /**
   * Helper: Build filters section
   */
  private static buildFiltersSection(query: ParsedRecruiterQuery): string {
    const filters: string[] = [];
    
    if (query.experience_level && query.experience_level !== 'any') {
      filters.push(`Experience: ${query.experience_level}`);
    }
    if (query.locations.length > 0) {
      filters.push(`Locations: ${query.locations.join(', ')}`);
    }
    if (query.min_cgpa) {
      filters.push(`Min CGPA: ${query.min_cgpa}`);
    }
    if (query.has_certifications) {
      filters.push(`Must have certifications`);
    }
    if (query.has_training) {
      filters.push(`Must have training`);
    }

    return filters.length > 0 ? `\n**FILTERS:** ${filters.join(' | ')}` : '';
  }

  /**
   * Helper: Quick match score calculation
   */
  private static calculateQuickMatchScore(
    candidate: any,
    query: ParsedRecruiterQuery
  ): number {
    if (query.required_skills.length === 0) return 75;

    const candidateSkills = candidate.skills.map((s: string) => s.toLowerCase());
    const matchedCount = query.required_skills.filter(reqSkill =>
      candidateSkills.some(cs => 
        cs.includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(cs)
      )
    ).length;

    const skillScore = (matchedCount / query.required_skills.length) * 60;
    const profileBonus = (candidate.profile_completeness || 50) * 0.25;
    const trainingBonus = Math.min(candidate.training_count * 3, 10);

    return Math.min(Math.round(skillScore + profileBonus + trainingBonus), 100);
  }
}

// Export convenience functions
export const buildMasterSystemPrompt = AdvancedPromptBuilder.buildMasterSystemPrompt;
export const buildCandidateSearchPrompt = AdvancedPromptBuilder.buildCandidateSearchPrompt;
export const buildOpportunityMatchingPrompt = AdvancedPromptBuilder.buildOpportunityMatchingPrompt;
export const buildPipelineAnalysisPrompt = AdvancedPromptBuilder.buildPipelineAnalysisPrompt;
export const buildSkillGapAnalysisPrompt = AdvancedPromptBuilder.buildSkillGapAnalysisPrompt;
