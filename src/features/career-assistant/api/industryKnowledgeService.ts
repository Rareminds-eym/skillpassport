/**
 * Industry Knowledge Service
 * AI-powered universal domain detection and industry research
 * Works for ANY industry/domain - not limited to pre-defined list
 */

import { getOpenAIClient, DEFAULT_MODEL } from './openAIClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('industry-knowledge-service');

export interface DomainDetectionResult {
  domain: string;
  subDomain?: string;
  confidence: number;
  industryContext: string;
  relatedDomains: string[];
}

export interface IndustryKnowledge {
  domain: string;
  commonProblems: string[];
  popularTechnologies: string[];
  complianceRequirements: string[];
  industryTrends: string[];
  jobOpportunities: string;
  typicalProjects: string[];
}

class IndustryKnowledgeService {
  /**
   * AI-Powered Universal Domain Detection
   * Detects ANY industry/domain from user query
   */
  async detectDomain(message: string, learnerProfile?: any): Promise<DomainDetectionResult> {
    try {
      const prompt = `Analyze this query and detect the industry/domain/sector:

**Query:** "${message}"

${learnerProfile ? `**Learner Context:** ${learnerProfile.department || 'Unknown'}` : ''}

**Your Task:**
Identify the industry/domain being discussed. Consider ALL possible domains including but not limited to:

**Technology Sectors:**
- Software Development/IT
- Cybersecurity
- Cloud Computing
- AI/Machine Learning
- Data Science/Analytics
- DevOps/SRE
- Mobile Development
- Game Development
- IoT/Embedded Systems

**Business Sectors:**
- Healthcare/Medical/Hospital
- Pharmaceutical/Chemical
- Education/E-learning
- Finance/Banking/Fintech
- Insurance
- Real Estate/Property
- Legal/Law/Compliance
- Manufacturing/Industrial
- Retail/E-commerce
- Supply Chain/Logistics
- Transportation/Automotive
- Energy/Utilities
- Telecommunications
- Media/Publishing/Entertainment
- Sports/Fitness/Wellness
- Food & Beverage/Restaurant
- Hospitality/Travel/Tourism
- Agriculture/Farming
- Construction/Architecture
- Government/Public Sector
- Non-profit/NGO/Social Impact
- Human Resources/Recruiting
- Marketing/Advertising
- Consulting/Professional Services

**Emerging Sectors:**
- Sustainability/Green Tech
- Space Technology
- Biotechnology
- Quantum Computing
- Web3/Blockchain/Crypto
- Virtual/Augmented Reality
- Robotics/Automation
- Clean Energy
- Smart Cities

**Or ANY OTHER domain not listed above!**

**Important:**
- Think broadly - user might mention: "hospital management" = Healthcare
- Think specifically - user might say: "veterinary clinic" = Healthcare + Animal Care
- Detect hybrid domains - "health education" = Healthcare + Education
- Consider context from query

**Output Format (JSON only):**
{
  "domain": "primary_domain_name",
  "subDomain": "more_specific_area_if_applicable",
  "confidence": 0.95,
  "industryContext": "brief description of detected industry",
  "relatedDomains": ["related_domain1", "related_domain2"]
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an industry classification expert. You can identify ANY industry or domain from user queries with deep understanding of context and nuance.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 400,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

      return {
        domain: result.domain || 'General Technology',
        subDomain: result.subDomain,
        confidence: result.confidence || 0.85,
        industryContext: result.industryContext || 'Technology sector',
        relatedDomains: result.relatedDomains || []
      };
    } catch (error) {
      logger.error('Failed to detect industry domain', error as Error, {
        hasProfile: !!learnerProfile,
        messageLength: message.length
      });
      return {
        domain: 'General Technology',
        confidence: 0.5,
        industryContext: 'General technology projects',
        relatedDomains: []
      };
    }
  }

  /**
   * AI-Powered Industry Research
   * Researches any industry on-the-fly to provide deep insights
   */
  async researchIndustry(
    domain: string,
    subDomain?: string,
    learnerSkills?: string[]
  ): Promise<IndustryKnowledge> {
    try {
      const prompt = `You are an industry research expert. Provide deep insights about this industry:

**Industry:** ${domain}
${subDomain ? `**Sub-sector:** ${subDomain}` : ''}
${learnerSkills ? `**Learner Skills:** ${learnerSkills.join(', ')}` : ''}

**Research and provide:**

1. **Top 5 Real Problems** in this industry that technology can solve
   - Real pain points businesses/users face
   - Specific, not generic

2. **Popular Technologies** used in this industry
   - Common tech stacks
   - Industry-standard tools
   - Emerging technologies

3. **Compliance/Regulatory Requirements**
   - Data regulations (HIPAA, GDPR, etc.)
   - Industry-specific compliance
   - Security requirements

4. **Current Industry Trends** (2024-2025)
   - What's hot right now
   - Emerging opportunities
   - Innovation areas

5. **Job Market Analysis**
   - Demand level for tech roles
   - Typical salary ranges
   - Top hiring companies

6. **Typical Project Types**
   - What companies actually build
   - Common software solutions
   - Innovation opportunities

**Be specific to ${domain}. Use real industry knowledge.**

**Output Format (JSON only):**
{
  "commonProblems": ["problem1", "problem2", "problem3", "problem4", "problem5"],
  "popularTechnologies": ["tech1", "tech2", "tech3", "tech4", "tech5"],
  "complianceRequirements": ["req1", "req2", "req3"],
  "industryTrends": ["trend1", "trend2", "trend3", "trend4"],
  "jobOpportunities": "Brief market analysis",
  "typicalProjects": ["project_type1", "project_type2", "project_type3"]
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an industry research expert with deep knowledge of technology trends, business problems, and market dynamics across all sectors.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 800,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

      return {
        domain,
        commonProblems: result.commonProblems || [],
        popularTechnologies: result.popularTechnologies || [],
        complianceRequirements: result.complianceRequirements || [],
        industryTrends: result.industryTrends || [],
        jobOpportunities: result.jobOpportunities || 'Growing demand for tech professionals',
        typicalProjects: result.typicalProjects || []
      };
    } catch (error) {
      logger.error('Failed to research industry knowledge', error as Error, {
        domain,
        subDomain,
        haslearnerSkills: !!learnerSkills && learnerSkills.length > 0
      });
      return {
        domain,
        commonProblems: [],
        popularTechnologies: [],
        complianceRequirements: [],
        industryTrends: [],
        jobOpportunities: 'Market data unavailable',
        typicalProjects: []
      };
    }
  }

  /**
   * Detect if query mentions multiple domains
   */
  async detectMultipleDomains(message: string): Promise<string[]> {
    try {
      const prompt = `Analyze if this query mentions multiple industries/domains:

"${message}"

Look for:
- "X and Y" - e.g., "health and education"
- "X or Y" - e.g., "finance or retail"
- Multiple domain keywords
- Cross-industry projects

**Output (JSON):**
{
  "multipleDomains": true/false,
  "domains": ["domain1", "domain2"],
  "isHybrid": true/false
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: 'You detect multiple domains in queries.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return result.multipleDomains ? result.domains : [];
    } catch (error) {
      return [];
    }
  }
}

export const industryKnowledgeService = new IndustryKnowledgeService();
export default industryKnowledgeService;
