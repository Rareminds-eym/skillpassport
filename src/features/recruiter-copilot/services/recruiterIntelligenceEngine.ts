import OpenAI from 'openai';
import { buildRecruiterSystemPrompt, buildIntentClassificationPrompt, buildGeneralResponsePrompt } from '../prompts/intelligentPrompt';
import { buildRecruiterContext } from '../utils/contextBuilder';
import { RecruiterAIResponse, RecruiterIntent } from '../types';
import { recruiterInsights } from './recruiterInsights';
import { talentAnalytics } from './talentAnalytics';
import { queryParser } from './queryParser';
import { semanticSearch } from './semanticSearch';
import { dataHealthCheck } from '../utils/dataHealthCheck';
import { advancedIntentClassifier } from './advancedIntentClassifier';
import { supabase } from '../../../lib/supabaseClient';

// Initialize OpenRouter client
let openai: OpenAI | null = null;

const getOpenAIClient = (): OpenAI => {
  if (!openai) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey || apiKey === '') {
      console.error('❌ VITE_OPENAI_API_KEY is not set in .env file!');
      throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
    }
    
    console.log('✅ Recruiter AI client initializing with OpenRouter:', apiKey.substring(0, 10) + '...');
    
    openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      defaultHeaders: {
        "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : '',
        "X-Title": "SkillPassport Recruiter AI",
      },
      dangerouslyAllowBrowser: true
    });
  }
  return openai;
};

const DEFAULT_MODEL = 'openrouter/polaris-alpha'; // Fast and cost-effective model

/**
 * Recruiter Intelligence Engine
 * Central AI service for processing recruiter queries and providing insights
 */
class RecruiterIntelligenceEngine {
  private conversationHistory: Map<string, any[]> = new Map();

  /**
   * Main entry point - Process recruiter query with full intelligence
   */
  async processQuery(
    query: string,
    recruiterId: string,
    conversationId?: string
  ): Promise<RecruiterAIResponse> {
    try {
      console.log('🎯 Recruiter AI processing:', query);

      // Step 1: Build recruiter context
      const recruiterContext = await buildRecruiterContext(recruiterId);

      // Step 2: Get conversation history
      const history = this.getConversationHistory(conversationId || recruiterId);

      // Step 3: Classify intent using advanced multi-layered system
      const classifiedIntent = await advancedIntentClassifier.classifyIntent(
        query,
        history,
        recruiterContext
      );
      const intent = classifiedIntent.primary;
      console.log('📊 Detected intent:', intent, `(confidence: ${(classifiedIntent.confidence * 100).toFixed(0)}%)`);
      
      if (classifiedIntent.detectedEntities.urgency) {
        console.log('⏰ Urgency detected:', classifiedIntent.detectedEntities.urgency);
      }
      
      if (classifiedIntent.needsClarification && classifiedIntent.clarificationQuestions) {
        console.log('❓ Needs clarification:', classifiedIntent.clarificationQuestions[0]);
      }

      // Step 4: Handle clarification if needed
      if (classifiedIntent.needsClarification && classifiedIntent.confidence < 0.6) {
        return {
          success: true,
          message: `I want to help you find the right information. ${classifiedIntent.clarificationQuestions?.join('\n') || ''}`,
          data: { classifiedIntent },
          interactive: {
            metadata: {
              intentHandled: 'Clarification Needed',
              nextSteps: classifiedIntent.suggestedActions,
              encouragement: 'Let me know more details so I can assist you better!'
            },
            suggestions: [
              'Find candidates',
              'Show talent pool analytics',
              'Match candidates to a job',
              'Get hiring recommendations'
            ]
          }
        };
      }

      // Step 5: Generate response based on intent
      const response = await this.generateIntelligentResponse(
        query,
        intent,
        recruiterContext,
        history,
        classifiedIntent,
        recruiterId
      );

      // Step 6: Store in conversation history with classified intent
      this.updateConversationHistory(conversationId || recruiterId, query, response.message || '', intent, classifiedIntent);

      return response;
    } catch (error) {
      console.error('❌ Recruiter AI Error:', error);
      return {
        success: false,
        error: 'I encountered an error processing your request. Please try again.',
        message: 'I apologize, but I encountered an error. Please make sure your OpenAI API key is configured correctly.'
      };
    }
  }


  /**
   * Generate intelligent response with appropriate format
   */
  private async generateIntelligentResponse(
    query: string,
    intent: RecruiterIntent,
    recruiterContext: any,
    history: any[],
    classifiedIntent?: any,
    recruiterId?: string
  ): Promise<RecruiterAIResponse> {
    try {
      // Handle hiring recommendations with AI analysis
      if (intent === 'hiring-recommendations') {
        console.log('🎯 Generating hiring readiness recommendations...');
        
        // Get top candidates
        const candidates = await recruiterInsights.getTopCandidates(20);
        
        if (candidates.length === 0) {
          return {
            success: true,
            message: 'No candidates found in your talent pool. Start by adding candidates!'
          };
        }
        
        // Filter hire-ready candidates (good profile, has skills)
        const hireReady = candidates.filter(c => 
          c.profile_completeness >= 30 && c.skills.length > 0
        ).slice(0, 10);
        
        if (hireReady.length === 0) {
          return {
            success: true,
            message: `⚠️ No candidates are currently hire-ready.\n\n**Issues found:**\n• ${candidates.filter(c => c.skills.length === 0).length} candidates have no skills listed\n• ${candidates.filter(c => c.profile_completeness < 30).length} have incomplete profiles\n\n**Recommendation:** Ask candidates to complete their profiles and add skills before hiring.`,
            data: { candidates: candidates.slice(0, 5) }
          };
        }
        
        // Use AI to analyze hire-readiness
        const client = getOpenAIClient();
        const analysisPrompt = `You are a hiring expert. Analyze these candidates and recommend who is ready to hire NOW.

CANDIDATES:
${hireReady.map((c, i) => `
${i + 1}. **${c.name}**
   Skills: ${c.skills.slice(0, 5).join(', ')}${c.skills.length > 5 ? ` +${c.skills.length - 5} more` : ''}
   Profile Completeness: ${c.profile_completeness}%
   Location: ${c.location || 'Not specified'}
   University: ${c.institution || 'Not specified'}
   CGPA: ${c.cgpa || 'Not specified'}`).join('\n')}

Provide:
1. **Top 3 candidates ready to hire NOW** with reasoning
2. **Hiring readiness score** (0-100) for each
3. **Key strengths** that make them hire-ready
4. **Immediate next steps** for each

Format:
🎯 **READY TO HIRE: [Name]**
Readiness Score: [X]/100
Why: [reason]
Strengths: • [point 1] • [point 2]
Next Step: [immediate action]`;
        
        const aiResponse = await client.chat.completions.create({
          model: 'openrouter/polaris-alpha',
          messages: [{ role: 'user', content: analysisPrompt }],
          temperature: 0.7,
          max_tokens: 1000
        });
        
        const recommendation = aiResponse.choices[0]?.message?.content || 'Unable to generate recommendation.';
        
        return {
          success: true,
          message: `👨‍💼 **Hiring Readiness Analysis**\n\nAnalyzed ${hireReady.length} hire-ready candidates from ${candidates.length} total:\n\n${recommendation}`,
          data: { candidates: hireReady, totalAnalyzed: candidates.length },
          interactive: {
            metadata: {
              intentHandled: 'Hiring Readiness Recommendations',
              nextSteps: [
                'Contact top candidates immediately',
                'Schedule screening calls',
                'Send job descriptions'
              ],
              encouragement: 'These candidates are ready - act fast before competitors do!'
            },
            suggestions: [
              'Show candidate details',
              'Schedule interviews',
              'Compare top 2 candidates'
            ]
          }
        };
      }

      // Data-first handling for core intents using real DB
      if (intent === 'candidate-search') {
        console.log('🔍 Parsing query for smart search...');
        
        // Parse query to extract filters
        const parsedQuery = await queryParser.parseQuery(query);
        console.log('📊 Parsed query:', parsedQuery);
        
        // Check if requested skills exist in database
        if (parsedQuery.required_skills.length > 0) {
          const skillChecks = await Promise.all(
            parsedQuery.required_skills.map(skill => dataHealthCheck.skillExists(skill))
          );
          const existingSkills = parsedQuery.required_skills.filter((_, idx) => skillChecks[idx]);
          const missingSkills = parsedQuery.required_skills.filter((_, idx) => !skillChecks[idx]);
          
          if (missingSkills.length > 0) {
            console.log(`⚠️ Skills not found in database: ${missingSkills.join(', ')}`);
            
            // Get suggestions for missing skills
            const suggestions = await Promise.all(
              missingSkills.map(skill => dataHealthCheck.suggestSimilarSkills(skill, 3))
            );
            
            const flatSuggestions = suggestions.flat();
            if (flatSuggestions.length > 0) {
              console.log('💡 Similar skills found:', flatSuggestions);
            } else {
              // If no similar skills, show what skills ARE available
              const availableSkills = await dataHealthCheck.getCommonSkills(15);
              if (availableSkills.length > 0) {
                console.log('💡 Available skills in database:', availableSkills.map(s => s.skill).join(', '));
              }
            }
          }
        }
        
        // Use semantic/hybrid search if filters exist, otherwise get top candidates
        let candidates;
        if (parsedQuery.required_skills.length > 0 || parsedQuery.locations.length > 0 || parsedQuery.min_cgpa) {
          console.log('🎯 Using hybrid search with filters');
          candidates = await semanticSearch.hybridCandidateSearch(parsedQuery, 20);
        } else {
          console.log('📋 Using general top candidates');
          candidates = await recruiterInsights.getTopCandidates(15);
        }
        
        const top = candidates.slice(0, 10);
        
        // Build search summary
        const searchSummary = this.buildSearchSummary(parsedQuery, candidates.length, candidates);
        
        // Check if any candidates have the requested skills
        const hasMatchingSkills = top.some(c => 
          parsedQuery.required_skills.length === 0 || 
          c.skills.some(skill => 
            parsedQuery.required_skills.some(req => 
              skill.toLowerCase().includes(req.toLowerCase())
            )
          )
        );

        // Get available skills to suggest if search failed
        let availableSkillsMessage = '';
        if (!hasMatchingSkills && parsedQuery.required_skills.length > 0 && top.length > 0) {
          const availableSkills = await dataHealthCheck.getCommonSkills(10);
          if (availableSkills.length > 0) {
            availableSkillsMessage = `\n💡 Available skills to search: ${availableSkills.map(s => `${s.skill} (${s.count})`).slice(0, 5).join(', ')}\n`;
          }
        }
        
        // Check if location data is missing
        let locationDataWarning = '';
        if (parsedQuery.locations && parsedQuery.locations.length > 0 && top.length > 0) {
          const candidatesWithLocation = top.filter(c => c.location && c.location !== 'Location N/A').length;
          if (candidatesWithLocation === 0) {
            locationDataWarning = `\n⚠️ Note: Location data is missing for most candidates. Results shown are not filtered by "${parsedQuery.locations.join(', ')}".\n`;
          }
        }

        // Build helpful message for empty results
        let emptyResultsMessage = `No candidates found matching your criteria. ${searchSummary}`;
        
        if (parsedQuery.required_skills.length > 0 && candidates.length === 0) {
          // Get available skills to suggest
          const availableSkills = await dataHealthCheck.getCommonSkills(10);
          if (availableSkills.length > 0) {
            emptyResultsMessage += `\n\n💡 Skills available in database:\n${availableSkills.map(s => `  • ${s.skill} (${s.count} candidate${s.count !== 1 ? 's' : ''})`).slice(0, 8).join('\n')}`;
            emptyResultsMessage += `\n\nTry searching for one of these skills instead.`;
          } else {
            emptyResultsMessage += `\n\n⚠️ Your database has very limited skill data. Consider:\n• Importing skills from resumes\n• Asking students to update their profiles\n• Using "Show all candidates" to see everyone`;
          }
        } else {
          emptyResultsMessage += `\n\nTry:\n• Broadening skill requirements\n• Expanding location search\n• Lowering CGPA threshold`;
        }
        
        const message = top.length === 0
          ? emptyResultsMessage
          : [
              searchSummary,
              locationDataWarning,
              !hasMatchingSkills && parsedQuery.required_skills.length > 0 
                ? `\n⚠️ Note: No candidates have "${parsedQuery.required_skills.join(', ')}" skills recorded. Showing candidates ranked by profile quality.${availableSkillsMessage}`
                : '',
              `Top ${Math.min(8, top.length)} matches:`,
              ...top.slice(0, 8).map((c, i) => 
                `${i + 1}. ${c.name} — Skills: ${c.skills.length > 0 ? c.skills.slice(0, 3).join(', ') : 'Not listed'}${c.skills.length > 3 ? '...' : ''} | ${c.location || 'Location N/A'} | Profile: ${c.profile_completeness}%`
              )
            ].filter(Boolean).join('\n');

        return {
          success: true,
          message,
          data: { candidates: top, parsedQuery },
          interactive: {
            cards: top.map(c => ({
              type: 'candidate-insight',
              data: {
                candidateId: c.id,
                candidateName: c.name,
                insightType: c.profile_completeness && c.profile_completeness >= 75 ? 'top-match' : 'high-potential',
                title: `${c.name} - ${c.institution || 'Available'}`,
                description: `Skills: ${c.skills.slice(0, 5).join(', ')}${c.skills.length > 5 ? ` +${c.skills.length - 5} more` : ''}`,
                recommendation: c.profile_completeness && c.profile_completeness >= 75 
                  ? 'Strong profile - Review for immediate consideration'
                  : 'Good potential - Schedule initial screening',
                priority: c.profile_completeness && c.profile_completeness >= 80 ? 'high' : 'medium',
                matchScore: c.profile_completeness,
                matchedSkills: c.skills.slice(0, 5),
                actionItems: [
                  'Review complete profile and projects',
                  'Check availability and location fit',
                  'Schedule initial phone screening'
                ]
              }
            })),
            metadata: {
              intentHandled: this.getIntentLabel(intent),
              nextSteps: this.generateNextSteps(intent),
              encouragement: this.getEncouragement(intent),
              searchCriteria: {
                skills: parsedQuery.required_skills,
                locations: parsedQuery.locations,
                experienceLevel: parsedQuery.experience_level,
                minCgpa: parsedQuery.min_cgpa
              }
            },
            suggestions: this.generateSuggestions(intent)
          }
        };
      }

      if (intent === 'opportunity-applications') {
        console.log('💼 Fetching candidates who applied to opportunities...');
        
        if (!recruiterId) {
          return {
            success: false,
            message: 'Recruiter ID not found. Please log in again.',
            error: 'Missing recruiter ID'
          };
        }
        
        // Fetch all opportunities for this recruiter
        const { data: opportunities, error: oppError } = await supabase
          .from('opportunities')
          .select('id, job_title, company_name')
          .eq('recruiter_id', recruiterId)
          .order('created_at', { ascending: false });
        
        if (oppError) {
          console.error('❌ Error fetching opportunities:', oppError);
          return {
            success: false,
            message: 'Could not fetch your opportunities. Please try again.',
            error: oppError.message
          };
        }
        
        if (!opportunities || opportunities.length === 0) {
          return {
            success: true,
            message: 'You haven\'t posted any opportunities yet.\n\nCreate your first job posting to start receiving applications!',
            data: { opportunities: [], applicants: [] },
            interactive: {
              metadata: {
                intentHandled: 'Opportunity Applications',
                nextSteps: ['Create a new job opportunity', 'Invite candidates to apply'],
                encouragement: 'Start attracting top talent by posting your first opportunity!'
              },
              suggestions: ['Find candidates', 'Show talent pool analytics', 'What skills are available?']
            }
          };
        }
        
        // Fetch applicants from pipeline_candidates for these opportunities
        const opportunityIds = opportunities.map(o => o.id);
        const { data: applicants, error: applError } = await supabase
          .from('pipeline_candidates')
          .select(`
            id,
            opportunity_id,
            student_id,
            stage,
            status,
            created_at,
            students:student_id (
              name,
              email,
              university,
              currentCgpa
            )
          `)
          .in('opportunity_id', opportunityIds)
          .order('created_at', { ascending: false });
        
        if (applError) {
          console.error('❌ Error fetching applicants:', applError);
        }
        
        // Group applicants by opportunity
        const applicantsByOpportunity = new Map<number, any[]>();
        applicants?.forEach(app => {
          const existing = applicantsByOpportunity.get(app.opportunity_id) || [];
          applicantsByOpportunity.set(app.opportunity_id, [...existing, app]);
        });
        
        // Build summary
        const totalApplicants = applicants?.length || 0;
        const opportunitySummaries = opportunities.map(opp => {
          const apps = applicantsByOpportunity.get(opp.id) || [];
          return {
            ...opp,
            applicant_count: apps.length,
            applicants: apps
          };
        });
        
        const message = [
          `💼 Your Opportunities & Applications:`,
          ``,
          `Total Opportunities: ${opportunities.length}`,
          `Total Applications: ${totalApplicants}`,
          ``,
          ...opportunitySummaries.slice(0, 5).map((opp, i) => 
            `${i + 1}. ${opp.job_title} at ${opp.company_name}\n   👥 ${opp.applicant_count} applicant${opp.applicant_count !== 1 ? 's' : ''}`
          ),
          ``,
          totalApplicants > 0 
            ? `👉 Recent applicants:\n${opportunitySummaries
                .filter(o => o.applicant_count > 0)
                .slice(0, 3)
                .flatMap(o => o.applicants.slice(0, 2))
                .slice(0, 5)
                .map((app, i) => `   ${i + 1}. ${app.students?.name || 'Unknown'} - ${app.stage || 'New'} (${app.students?.university || 'N/A'})`)
                .join('\n')}`
            : '⚠️ No applications yet. Share your opportunities to attract candidates!'
        ].join('\n');
        
        return {
          success: true,
          message,
          data: { opportunities: opportunitySummaries, totalApplicants },
          interactive: {
            cards: opportunitySummaries.slice(0, 5).map(opp => ({
              type: 'opportunity-summary',
              data: {
                opportunityId: opp.id,
                title: opp.job_title,
                company: opp.company_name,
                applicantCount: opp.applicant_count,
                recentApplicants: opp.applicants.slice(0, 3).map((a: any) => a.students?.name || 'Unknown')
              }
            })),
            metadata: {
              intentHandled: 'Opportunity Applications',
              nextSteps: totalApplicants > 0 
                ? ['Review applicant profiles', 'Move promising candidates forward', 'Schedule interviews']
                : ['Share opportunity links', 'Search for matching candidates', 'Invite candidates to apply'],
              encouragement: totalApplicants > 0
                ? `Great! You have ${totalApplicants} application${totalApplicants !== 1 ? 's' : ''} to review.`
                : 'Proactively reach out to candidates to boost applications!'
            },
            suggestions: [
              'Find React developers',
              'Show me Python candidates',
              'Analyze my talent pool'
            ]
          }
        };
      }

      if (intent === 'hiring-decision') {
        console.log('🧠 Generating AI hiring recommendations from applicants...');
        
        if (!recruiterId) {
          return {
            success: false,
            message: 'Recruiter ID not found.',
            error: 'Missing recruiter ID'
          };
        }
        
        // Fetch recruiter's opportunities
        const { data: opportunities } = await supabase
          .from('opportunities')
          .select('id, job_title, company_name, skills_required, description')
          .eq('recruiter_id', recruiterId)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (!opportunities || opportunities.length === 0) {
          return {
            success: true,
            message: 'You don\'t have any active opportunities yet. Create one to receive applications!'
          };
        }
        
        // Fetch applicants from applied_jobs (using correct table)
        const oppIds = opportunities.map(o => o.id);
        const { data: applications } = await supabase
          .from('applied_jobs')
          .select(`
            id,
            student_id,
            opportunity_id,
            application_status,
            applied_at,
            students:student_id (
              user_id,
              name,
              email,
              university,
              currentCgpa,
              city,
              state,
              resumeUrl
            )
          `)
          .in('opportunity_id', oppIds)
          .in('application_status', ['applied', 'viewed', 'under_review', 'interview_scheduled'])
          .order('applied_at', { ascending: false });
        
        if (!applications || applications.length === 0) {
          return {
            success: true,
            message: `You have ${opportunities.length} active opportunit${opportunities.length === 1 ? 'y' : 'ies'} but no applications yet.\n\nTip: Share your job postings to attract candidates!`,
            data: { opportunities, applications: [] }
          };
        }
        
        // Fetch skills for applicants
        const studentIds = applications.map(a => a.student_id);
        const { data: skills } = await supabase
          .from('skills')
          .select('student_id, name, level')
          .in('student_id', studentIds)
          .eq('enabled', true);
        
        // Group skills by student
        const skillsByStudent = new Map<string, any[]>();
        skills?.forEach(skill => {
          const existing = skillsByStudent.get(skill.student_id) || [];
          skillsByStudent.set(skill.student_id, [...existing, skill]);
        });
        
        // Enrich applicants with skills
        const enrichedApplicants = applications.map(app => ({
          ...app,
          skills: skillsByStudent.get(app.student_id) || []
        }));
        
        // Use AI to analyze and recommend
        const client = getOpenAIClient();
        const analysisPrompt = `You are an expert hiring consultant. Analyze these job applicants and recommend the top 3 candidates to hire.

JOB OPPORTUNITIES:
${opportunities.map(o => `- ${o.job_title}: ${o.description || 'No description'} | Required: ${JSON.stringify(o.skills_required)}`).join('\n')}

APPLICANTS:
${enrichedApplicants.slice(0, 15).map((app, i) => `
${i + 1}. ${app.students?.name || 'Unknown'}
   University: ${app.students?.university || 'N/A'}
   CGPA: ${app.students?.currentCgpa || 'N/A'}
   Skills: ${app.skills.map(s => s.name).join(', ') || 'None listed'}
   Location: ${app.students?.city || 'N/A'}
   Status: ${app.application_status}
   Applied: ${new Date(app.applied_at).toLocaleDateString()}`).join('\n')}

Provide:
1. Top 3 recommended candidates with detailed reasoning
2. Match score (0-100) for each
3. Key strengths and any concerns
4. Suggested next steps

Format as:
**TOP RECOMMENDATION: [Name]**
Match Score: [X]/100
Strengths: • [point 1] • [point 2]
Concerns: [if any]
Next Step: [action]

[Repeat for 2nd and 3rd]`;
        
        const aiResponse = await client.chat.completions.create({
          model: 'openrouter/polaris-alpha',
          messages: [{ role: 'user', content: analysisPrompt }],
          temperature: 0.7,
          max_tokens: 1000
        });
        
        const recommendation = aiResponse.choices[0]?.message?.content || 'Unable to generate recommendation.';
        
        return {
          success: true,
          message: `🎯 **AI Hiring Recommendations**\n\nAnalyzed ${enrichedApplicants.length} applicant${enrichedApplicants.length !== 1 ? 's' : ''} across ${opportunities.length} opportunit${opportunities.length !== 1 ? 'ies' : 'y'}:\n\n${recommendation}`,
          data: {
            opportunities,
            applicants: enrichedApplicants,
            totalAnalyzed: enrichedApplicants.length
          },
          interactive: {
            metadata: {
              intentHandled: 'AI Hiring Decision',
              nextSteps: [
                'Contact top recommended candidates',
                'Schedule interviews',
                'Review detailed profiles'
              ],
              encouragement: 'AI has analyzed all applicants to help you make the best hiring decision!'
            },
            suggestions: [
              'Show all applications',
              'Compare top 2 candidates',
              'Schedule interviews'
            ]
          }
        };
      }

      if (intent === 'talent-pool-analytics') {
        const analytics = await talentAnalytics.getTalentPoolAnalytics();
        
        const message = [
          `📊 Talent Pool Overview:`,
          `• Total Candidates: ${analytics.total_candidates}`,
          `• Top Skills: ${analytics.by_skill.slice(0, 5).map(s => `${s.skill} (${s.count})`).join(', ')}`,
          `• Top Locations: ${analytics.by_location.slice(0, 3).map(l => l.location).join(', ')}`,
          `• Emerging Skills: ${analytics.emerging_skills.slice(0, 5).join(', ')}`
        ].join('\n');

        return {
          success: true,
          message,
          data: { analytics },
          interactive: {
            visualData: {
              skillDistribution: analytics.by_skill,
              locationDistribution: analytics.by_location,
              experienceDistribution: analytics.by_experience
            },
            metadata: {
              intentHandled: this.getIntentLabel(intent),
              nextSteps: ['Review skill gaps for your open positions', 'Identify location preferences for roles'],
              encouragement: 'Your talent pool is diverse! Focus on matching skills to your priority roles.'
            },
            suggestions: this.generateSuggestions(intent)
          }
        };
      }

      if (intent === 'skill-insights') {
        const analytics = await talentAnalytics.getTalentPoolAnalytics();
        const topSkills = analytics.by_skill.slice(0, 15);
        
        const message = [
          'Most common skills in your talent pool:',
          ...topSkills.map((s, i) => `${i + 1}. ${s.skill}: ${s.count} candidates`)
        ].join('\n');

        return {
          success: true,
          message,
          data: { skills: topSkills, emerging: analytics.emerging_skills },
          interactive: {
            visualData: { skillDistribution: topSkills },
            metadata: {
              intentHandled: this.getIntentLabel(intent),
              nextSteps: ['Match these skills to your job requirements', 'Identify skill gaps for training'],
              encouragement: 'Strong technical skill representation in your pool!'
            },
            suggestions: ['Find candidates with React', 'Show me Python developers', 'Match candidates to Software Engineer role']
          }
        };
      }

      if (intent === 'market-trends') {
        const marketData = await talentAnalytics.getMarketIntelligence();
        
        const message = [
          '📈 Current Market Intelligence:',
          '',
          '🔥 In-Demand Skills:',
          marketData.in_demand_skills.slice(0, 8).map(s => `  • ${s}`).join('\n'),
          '',
          '💼 Competitive Roles:',
          marketData.competitive_roles.slice(0, 5).map(r => `  • ${r}`).join('\n'),
          '',
          `📊 Hiring Velocity: ${marketData.hiring_velocity}`
        ].join('\n');

        return {
          success: true,
          message,
          data: { marketData },
          interactive: {
            metadata: {
              intentHandled: this.getIntentLabel(intent),
              nextSteps: ['Align job requirements with in-demand skills', 'Adjust compensation for competitive roles'],
              encouragement: 'Stay competitive by focusing on high-demand skills and fast hiring processes!'
            },
            suggestions: ['Find React developers', 'Show Python experts', 'Match to Data Scientist role']
          }
        };
      }

      // Handle data health check queries
      if (intent === 'general' && (query.toLowerCase().includes('data') || query.toLowerCase().includes('quality') || query.toLowerCase().includes('health'))) {
        const healthReport = await dataHealthCheck.checkDataHealth();
        const formattedReport = dataHealthCheck.formatHealthReport(healthReport);
        
        return {
          success: true,
          message: formattedReport,
          data: { healthReport },
          interactive: {
            metadata: {
              intentHandled: 'Data Health Check',
              nextSteps: healthReport.status === 'critical' 
                ? ['Import missing skills data', 'Update student profiles', 'Add location information']
                : ['Continue with candidate searches', 'Review data quality periodically'],
              encouragement: healthReport.status === 'healthy' 
                ? 'Your data quality is excellent! Ready for intelligent matching.'
                : 'Address data quality issues to improve AI matching accuracy.'
            },
            suggestions: [
              'Find candidates with available skills',
              'Show me common skills in the pool',
              'Analyze talent pool'
            ]
          }
        };
      }

      // For other intents, use AI to generate response
      return await this.generateAIResponse(query, recruiterContext, history);

    } catch (error) {
      console.error('Error generating response:', error);
      return await this.generateAIResponse(query, recruiterContext, history);
    }
  }

  /**
   * Generate AI response for general queries
   */
  private async generateAIResponse(
    query: string,
    recruiterContext: any,
    history: any[]
  ): Promise<RecruiterAIResponse> {
    try {
      const prompt = buildGeneralResponsePrompt(query, recruiterContext, history);
      const client = getOpenAIClient();

      const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      });

      const aiMessage = response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

      return {
        success: true,
        message: aiMessage,
        interactive: {
          suggestions: [
            'Show me top candidates',
            'Analyze my talent pool',
            'What skills are most common?'
          ]
        }
      };
    } catch (error) {
      console.error('AI generation error:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  private getConversationHistory(conversationId: string): any[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  /**
   * Update conversation history
   */
  private updateConversationHistory(
    conversationId: string, 
    query: string, 
    response: string, 
    intent?: RecruiterIntent,
    classifiedIntent?: any
  ): void {
    const history = this.getConversationHistory(conversationId);
    history.push({ 
      query, 
      response, 
      intent,
      entities: classifiedIntent?.detectedEntities,
      timestamp: new Date() 
    });
    
    // Keep only last 10 exchanges
    if (history.length > 10) {
      history.shift();
    }
    
    this.conversationHistory.set(conversationId, history);
  }

  /**
   * Get intent display label
   */
  private getIntentLabel(intent: RecruiterIntent): string {
    const labels: Record<RecruiterIntent, string> = {
      'candidate-search': 'Candidate Search',
      'talent-pool-analytics': 'Talent Pool Analytics',
      'job-matching': 'Job Matching',
      'hiring-recommendations': 'Hiring Recommendations',
      'skill-insights': 'Skill Insights',
      'market-trends': 'Market Trends',
      'interview-guidance': 'Interview Guidance',
      'candidate-assessment': 'Candidate Assessment',
      'pipeline-review': 'Pipeline Review',
      'general': 'General Query'
    };
    return labels[intent];
  }

  /**
   * Generate next steps based on intent
   */
  private generateNextSteps(intent: RecruiterIntent): string[] {
    const steps: Record<RecruiterIntent, string[]> = {
      'candidate-search': ['Review candidate profiles in detail', 'Schedule screening calls', 'Check availability'],
      'talent-pool-analytics': ['Identify skill gaps', 'Plan targeted recruitment', 'Review location distribution'],
      'job-matching': ['Review match scores', 'Schedule interviews with top matches', 'Provide feedback'],
      'hiring-recommendations': ['Contact top candidates', 'Begin interview process', 'Check references'],
      'skill-insights': ['Match skills to job requirements', 'Identify upskilling opportunities'],
      'market-trends': ['Adjust job descriptions', 'Review compensation packages', 'Speed up hiring process'],
      'interview-guidance': ['Prepare interview questions', 'Schedule interviews', 'Brief hiring team'],
      'candidate-assessment': ['Compare candidates', 'Check references', 'Make hiring decision'],
      'pipeline-review': ['Follow up with candidates', 'Update pipeline status', 'Schedule next interviews'],
      'general': ['Explore candidate profiles', 'Review talent analytics', 'Plan next hiring steps']
    };
    return steps[intent] || steps['general'];
  }

  /**
   * Get encouragement message
   */
  private getEncouragement(intent: RecruiterIntent): string {
    const messages: Record<RecruiterIntent, string> = {
      'candidate-search': 'Great candidates are waiting! Take action to connect with them.',
      'talent-pool-analytics': 'Your talent pool insights can drive strategic hiring decisions!',
      'job-matching': 'Strong matches found! Move quickly to secure top talent.',
      'hiring-recommendations': 'These candidates show great potential - reach out soon!',
      'skill-insights': 'Understanding skill distribution helps you hire smarter!',
      'market-trends': 'Stay ahead by aligning with market demands!',
      'interview-guidance': 'Prepared interviews lead to better hiring outcomes!',
      'candidate-assessment': 'Thorough assessment ensures the right hire!',
      'pipeline-review': 'Keep your pipeline moving to secure great talent!',
      'general': 'I\'m here to help you make smart hiring decisions!'
    };
    return messages[intent] || messages['general'];
  }

  /**
   * Build search summary from parsed query
   */
  private buildSearchSummary(parsedQuery: any, resultCount: number, candidates: any[]): string {
    const parts: string[] = [];
    
    if (parsedQuery.required_skills.length > 0) {
      parts.push(`Skills: ${parsedQuery.required_skills.slice(0, 3).join(', ')}${parsedQuery.required_skills.length > 3 ? ` +${parsedQuery.required_skills.length - 3} more` : ''}`);
    }
    
    if (parsedQuery.locations.length > 0) {
      // Check how many actually match the location
      const withLocation = candidates.filter(c => {
        const location = (c.location || '').toLowerCase();
        return parsedQuery.locations.some((loc: string) => location.includes(loc.toLowerCase()));
      }).length;
      
      if (withLocation > 0) {
        parts.push(`Location: ${parsedQuery.locations.join(', ')} (${withLocation} match${withLocation !== 1 ? 'es' : ''})`);
      } else {
        parts.push(`Location preference: ${parsedQuery.locations.join(', ')} (0 matches - showing all)`);
      }
    }
    
    if (parsedQuery.min_cgpa) {
      parts.push(`Min CGPA: ${parsedQuery.min_cgpa}`);
    }
    
    if (parsedQuery.experience_level && parsedQuery.experience_level !== 'any') {
      parts.push(`Experience: ${parsedQuery.experience_level}`);
    }
    
    const criteria = parts.length > 0 ? ` (${parts.join(' | ')})` : '';
    return `🔍 Found ${resultCount} candidate${resultCount !== 1 ? 's' : ''}${criteria}`;
  }

  /**
   * Generate contextual suggestions
   */
  private generateSuggestions(intent: RecruiterIntent): string[] {
    const suggestions: Record<RecruiterIntent, string[]> = {
      'candidate-search': ['Find React developers', 'Show candidates with 3+ projects', 'Filter by location'],
      'talent-pool-analytics': ['Show skill distribution', 'Analyze by experience level', 'Check location trends'],
      'job-matching': ['Match to Software Engineer role', 'Find Data Scientist candidates', 'Show top matches'],
      'hiring-recommendations': ['Who should I interview first?', 'Show hiring-ready candidates', 'Best fits for urgent roles'],
      'skill-insights': ['What skills are trending?', 'Show emerging skills', 'Compare skill levels'],
      'market-trends': ['What roles are competitive?', 'Show in-demand skills', 'Check hiring velocity'],
      'interview-guidance': ['Interview tips for engineers', 'Technical assessment questions', 'Cultural fit evaluation'],
      'candidate-assessment': ['Compare top 3 candidates', 'Evaluate technical skills', 'Check soft skills'],
      'pipeline-review': ['Show pipeline status', 'Candidates pending response', 'Next interviews scheduled'],
      'general': ['Show top candidates', 'Analyze talent pool', 'Match candidates to jobs']
    };
    return suggestions[intent] || suggestions['general'];
  }
}

export const recruiterIntelligenceEngine = new RecruiterIntelligenceEngine();
