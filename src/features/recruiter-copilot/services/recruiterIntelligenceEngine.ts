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

const DEFAULT_MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free'; // Fast and cost-effective model

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
        
        // Categorize candidates by data quality
        const withSkills = candidates.filter(c => c.skills.length > 0);
        const withoutSkills = candidates.filter(c => c.skills.length === 0);
        const lowProfile = candidates.filter(c => c.profile_completeness < 30);
        
        // Show all candidates with skills (even if low profile completeness)
        const candidatesToShow = withSkills.length > 0 
          ? withSkills.slice(0, 10)
          : candidates.slice(0, 10);
        
        // Data quality warning
        let dataQualityWarning = '';
        if (withoutSkills.length > 0) {
          dataQualityWarning = `\n⚠️ **Data Quality Alert:**\n• ${withoutSkills.length} out of ${candidates.length} candidates have NO skills listed\n• ${lowProfile.length} have incomplete profiles (<30%)\n`;
        }
        
        // Use AI to analyze candidates
        const client = getOpenAIClient();
        const analysisPrompt = `You are a hiring expert. Analyze these candidates and provide honest assessments.

CANDIDATES (${candidatesToShow.length} total):
${candidatesToShow.map((c, i) => `
${i + 1}. **${c.name}**
   Skills: ${c.skills.length > 0 ? c.skills.slice(0, 8).join(', ') : 'NO SKILLS LISTED'}${c.skills.length > 8 ? ` +${c.skills.length - 8} more` : ''}
   Profile Completeness: ${c.profile_completeness}%
   Location: ${c.location || 'Not specified'}
   University: ${c.institution || 'Not specified'}
   CGPA: ${c.cgpa || 'Not specified'}
   Training: ${c.training_count || 0} courses | Certificates: ${c.experience_count || 0}`).join('\n')}

Provide realistic assessment:
1. **Top 3-5 candidates** (or all if fewer) with honest evaluation
2. **Readiness Score** (0-100) - be realistic, not all need to be high
3. **Strengths** and **Concerns**
4. **Action needed** before they're interview-ready

CRITICAL RULES:
• ONLY analyze the ${candidatesToShow.length} candidates listed above - DO NOT make up statistics
• DO NOT cite LinkedIn, Glassdoor, or external market data
• DO NOT invent percentages like "22% YoY growth" or similar
• If skills look generic/vague (like "testing", "life Evaluation"), flag as DATA QUALITY ISSUE
• Be honest about data quality - if candidates lack skills, say so clearly
• Base your analysis ONLY on the data provided above

Format:
**[Name]** - Readiness: [X]/100
✅ Strengths: [list]
⚠️ Concerns: [list]
📋 Next Steps: [actions needed]`;
        
        const aiResponse = await client.chat.completions.create({
          model: 'nvidia/nemotron-nano-12b-v2-vl:free',
          messages: [{ role: 'user', content: analysisPrompt }],
          temperature: 0.7,
          max_tokens: 1000
        });
        
        const recommendation = aiResponse.choices[0]?.message?.content || 'Unable to generate recommendation.';
        
        return {
          success: true,
          message: `👨‍💼 **Candidate Analysis**\n\nAnalyzed ${candidatesToShow.length} candidates from ${candidates.length} total:\n${dataQualityWarning}\n${recommendation}`,
          data: { 
            candidates: candidatesToShow, 
            totalAnalyzed: candidates.length,
            dataQuality: {
              withSkills: withSkills.length,
              withoutSkills: withoutSkills.length,
              lowProfile: lowProfile.length
            }
          },
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

      // Handle specific candidate lookup queries
      if (intent === 'candidate-query') {
        console.log('🔍 Looking up specific candidate information...');
        
        if (!recruiterId) {
          return {
            success: false,
            message: 'Recruiter ID not found.',
            error: 'Missing recruiter ID'
          };
        }
        
        // Extract candidate name from query - matches patterns like "P.DURKADEVID", "John Smith", "JOHN DOE"
        const candidateNameMatch = query.match(/\b([A-Z]\.?\s*[A-Z]+(?:[a-zA-Z]+)?|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/);
        const candidateName = candidateNameMatch ? candidateNameMatch[0] : '';
        
        if (!candidateName) {
          return {
            success: true,
            message: `Could not identify a valid candidate name in your query.\n\n**Tips:**\n• Use the candidate's full name (e.g., "John Doe" or "P.DURKADEVID")\n• Check spelling and capitalization\n• Try: "Show all applicants" to see who has applied\n\n**Examples:**\n• "What jobs did John Smith apply to?"\n• "Tell me about Sarah Johnson"\n• "P.DURKADEVID applied for what role?"`
          };
        }
        
        console.log('👤 Searching for candidate:', candidateName);
        
        // Fetch recruiter's opportunities
        const { data: opportunities } = await supabase
          .from('opportunities')
          .select('id, job_title, company_name')
          .eq('recruiter_id', recruiterId);
        
        if (!opportunities || opportunities.length === 0) {
          return {
            success: true,
            message: 'You don\'t have any opportunities yet.'
          };
        }
        
        const oppIds = opportunities.map(o => o.id);
        
        // STEP 1: Find matching students first (proper name filtering)
        const { data: matchingStudents } = await supabase
          .from('students')
          .select('user_id, name, email, university, currentCgpa, city, state')
          .ilike('name', `%${candidateName}%`);
        
        if (!matchingStudents || matchingStudents.length === 0) {
          return {
            success: true,
            message: `No candidate found with name matching "${candidateName}".\n\nPossible reasons:\n• Name spelling might be different\n• Candidate hasn't applied to your jobs\n• Try the full exact name\n\n**Tip:** Use "Show all applicants" to see everyone who applied.`
          };
        }
        
        const studentIds = matchingStudents.map(s => s.user_id);
        console.log(`🔍 Found ${matchingStudents.length} student(s) matching "${candidateName}":`, matchingStudents.map(s => s.name));
        
        // STEP 2: Get their applications in pipeline_candidates
        const { data: pipelineCandidates } = await supabase
          .from('pipeline_candidates')
          .select('id, opportunity_id, student_id, stage, status, created_at')
          .in('opportunity_id', oppIds)
          .in('student_id', studentIds);
        
        // STEP 3: Get their formal applications
        const { data: appliedJobs } = await supabase
          .from('applied_jobs')
          .select('id, student_id, opportunity_id, application_status, applied_at')
          .in('opportunity_id', oppIds)
          .in('student_id', studentIds);
        
        // Combine results with student data
        const allMatches = [];
        
        // Create student lookup map
        const studentMap = new Map(matchingStudents.map(s => [s.user_id, s]));
        
        if (pipelineCandidates && pipelineCandidates.length > 0) {
          pipelineCandidates.forEach(candidate => {
            const student = studentMap.get(candidate.student_id);
            const opp = opportunities.find(o => o.id === candidate.opportunity_id);
            allMatches.push({
              student_id: candidate.student_id,
              candidate_name: student?.name || 'Unknown',
              opportunity_title: opp?.job_title || 'Unknown',
              company: opp?.company_name || 'Unknown',
              status: candidate.status || candidate.stage || 'In Pipeline',
              source: 'pipeline',
              date: candidate.created_at,
              university: student?.university,
              cgpa: student?.currentCgpa,
              location: `${student?.city || ''}, ${student?.state || ''}`.trim().replace(/^,\s*|\s*,$/, '')
            });
          });
        }
        
        if (appliedJobs && appliedJobs.length > 0) {
          appliedJobs.forEach(application => {
            const student = studentMap.get(application.student_id);
            const opp = opportunities.find(o => o.id === application.opportunity_id);
            allMatches.push({
              student_id: application.student_id,
              candidate_name: student?.name || 'Unknown',
              opportunity_title: opp?.job_title || 'Unknown',
              company: opp?.company_name || 'Unknown',
              status: application.application_status || 'Applied',
              source: 'applied',
              date: application.applied_at,
              university: student?.university,
              cgpa: student?.currentCgpa,
              location: `${student?.city || ''}, ${student?.state || ''}`.trim().replace(/^,\s*|\s*,$/, '')
            });
          });
        }
        
        if (allMatches.length === 0) {
          // Student exists but hasn't applied to this recruiter's jobs
          const studentNames = matchingStudents.map(s => s.name).join(', ');
          return {
            success: true,
            message: `Found candidate(s) matching "${candidateName}": **${studentNames}**\n\nHowever, they haven't applied to any of your opportunities yet.\n\n**Next steps:**\n• Source them for your open positions\n• Send them an invitation to apply\n• Add them to your pipeline manually`
          };
        }
        
        // Build response message
        const uniqueCandidateNames = [...new Set(allMatches.map(m => m.candidate_name))];
        const multipleMatches = uniqueCandidateNames.length > 1;
        
        const message = [
          `👤 **${allMatches[0].candidate_name}** - Candidate Information`,
          multipleMatches ? `⚠️ Note: Found ${uniqueCandidateNames.length} candidates matching "${candidateName}": ${uniqueCandidateNames.join(', ')}. Showing first match.` : '',
          ``,
          `📍 ${allMatches[0].location || 'Location not specified'}`,
          `🎓 ${allMatches[0].university || 'University not specified'}`,
          allMatches[0].cgpa ? `📊 CGPA: ${allMatches[0].cgpa}` : '',
          ``,
          `💼 **Applied to ${allMatches.length} position${allMatches.length !== 1 ? 's' : ''}:**`,
          ``,
          ...allMatches.map((match, i) => 
            `${i + 1}. **${match.opportunity_title}** at ${match.company}\n   Status: ${match.status} | ${match.source === 'pipeline' ? 'Sourced' : 'Formal Application'}\n   Date: ${new Date(match.date).toLocaleDateString()}`
          )
        ].filter(Boolean).join('\n');
        
        return {
          success: true,
          message,
          data: { candidate: allMatches[0].candidate_name, matches: allMatches },
          interactive: {
            metadata: {
              intentHandled: 'Candidate Lookup',
              nextSteps: [
                'Review full candidate profile',
                'Move candidate forward in pipeline',
                'Schedule interview'
              ],
              encouragement: `Found ${allMatches.length} record${allMatches.length !== 1 ? 's' : ''} for this candidate.`
            },
            suggestions: [
              'Show all applicants',
              'Compare candidates',
              'View pipeline status'
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
        
        // Sort to show opportunities WITH applicants first, then by creation date
        const sortedOpportunities = [...opportunitySummaries].sort((a, b) => {
          // First priority: opportunities with applicants
          if (a.applicant_count > 0 && b.applicant_count === 0) return -1;
          if (a.applicant_count === 0 && b.applicant_count > 0) return 1;
          // Second priority: more applicants first
          if (a.applicant_count !== b.applicant_count) return b.applicant_count - a.applicant_count;
          // Third priority: maintain original order (newest first from query)
          return 0;
        });
        
        // Show up to 15 opportunities (prioritizing those with applicants)
        const displayLimit = 15;
        const displayedOpps = sortedOpportunities.slice(0, displayLimit);
        const hasMore = opportunities.length > displayLimit;
        
        const message = [
          `💼 Your Opportunities & Applications:`,
          ``,
          `Total Opportunities: ${opportunities.length}`,
          `Total Applications: ${totalApplicants}`,
          ``,
          totalApplicants > 0 ? `Showing opportunities with applicants first:` : `Showing ${displayedOpps.length} most recent opportunities:`,
          ``,
          ...displayedOpps.map((opp, i) => 
            `${i + 1}. **${opp.job_title}** at ${opp.company_name}\n   👥 ${opp.applicant_count} applicant${opp.applicant_count !== 1 ? 's' : ''}${opp.applicant_count > 0 ? ` - ${opp.applicants.map((a: any) => a.students?.name || 'Unknown').slice(0, 2).join(', ')}${opp.applicant_count > 2 ? ` +${opp.applicant_count - 2} more` : ''}` : ''}`
          ),
          hasMore ? `\n... and ${opportunities.length - displayLimit} more opportunities` : '',
          ``
        ].filter(Boolean).join('\n');
        
        return {
          success: true,
          message,
          data: { opportunities: sortedOpportunities, totalApplicants },
          interactive: {
            cards: displayedOpps.map(opp => ({
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
          model: 'nvidia/nemotron-nano-12b-v2-vl:free',
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
      'candidate-query': 'Candidate Lookup',
      'opportunity-applications': 'Opportunity Applications',
      'hiring-decision': 'Hiring Decision',
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
      'candidate-query': ['View full candidate profile', 'Check application status', 'Move to next pipeline stage'],
      'opportunity-applications': ['Review all applications', 'Contact applicants', 'Schedule interviews'],
      'hiring-decision': ['Review AI recommendations', 'Compare finalists', 'Make hiring decision'],
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
      'candidate-query': 'Review this candidate\'s full profile to make the best decision!',
      'opportunity-applications': 'Stay on top of your applications - respond quickly to stand out!',
      'hiring-decision': 'AI insights help you make data-driven hiring decisions!',
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
      'candidate-query': ['Show all applicants', 'View pipeline status', 'Compare candidates'],
      'opportunity-applications': ['Show all applications', 'Review by opportunity', 'Schedule interviews'],
      'hiring-decision': ['Who should I hire?', 'Compare top applicants', 'Show recommendations'],
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
