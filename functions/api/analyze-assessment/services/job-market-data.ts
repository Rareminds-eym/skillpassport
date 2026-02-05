/**
 * Job Market Data Service
 * Fetches real-time Indian job market data using AI with web search
 */

import { callOpenRouterWithRetry, getAPIKeys, AI_MODELS } from '../../shared/ai-config';
import type { PagesEnv } from '../../../../src/functions-lib/types';

export interface JobMarketData {
  category: string;
  description?: string;
  whyBetter?: string;
  bestFor?: string;
  roles: Array<{
    title: string;
    salaryRange: {
      entry: { min: number; max: number };
      mid: { min: number; max: number };
      senior?: { min: number; max: number };
    };
    demand: 'high' | 'medium' | 'low';
    growthRate: number;
    skills: string[];
  }>;
}

/**
 * Fetch real-time job market data for specific career categories
 * Uses AI with web search to get current Indian salary data
 */
export async function fetchJobMarketData(
  env: PagesEnv,
  categories: string[]
): Promise<Record<string, JobMarketData>> {
  console.log('[JOB MARKET] Fetching real-time data for categories:', categories.join(', '));

  const { openRouter } = getAPIKeys(env);
  if (!openRouter) {
    console.warn('[JOB MARKET] OpenRouter API key not found, using fallback data');
    return {};
  }

  const prompt = `You are a career market analyst specializing in the Indian job market (2026).

Research and provide CURRENT, ACCURATE salary data for these career categories in India:
${categories.map((cat, i) => `${i + 1}. ${cat}`).join('\n')}

For EACH category, provide:
- Category description (why this sector is good, growth stats, market trends)
- 5-8 specific job roles that are in HIGH DEMAND in India (2026)
- REALISTIC salary ranges in Indian Rupees (Lakhs per annum) for entry-level (0-3 years), mid-level (3-8 years), and senior-level (8+ years)
- Current demand level (high/medium/low) based on job market trends
- Year-over-year growth rate (%)
- Top 3-5 required skills per role
- Why this category is better than alternatives (market insights)

CRITICAL REQUIREMENTS:
1. Use ONLY current 2026 Indian job market data
2. Salary ranges must be REALISTIC for India (not US/global salaries)
3. Focus on roles with ACTUAL job openings in India
4. Include both traditional and emerging roles
5. Consider tier-1 cities (Mumbai, Bangalore, Delhi, Hyderabad) as baseline
6. Provide market insights (job additions, growth %, stability)

Return ONLY valid JSON in this exact format:
{
  "Technology & Digital Innovation": {
    "category": "Technology & Digital Innovation",
    "description": "Why this sector is attractive (growth stats, job additions, market trends)",
    "whyBetter": "Specific reasons this is better than alternatives (e.g., 'Healthcare sector added 7.5M jobs (62% YoY growth). Entry-level roles growing 25% annually. Stable, recession-proof.')",
    "bestFor": "Student profile types (e.g., 'BEST for S+I combinations, moderate aptitude')",
    "roles": [
      {
        "title": "AI/ML Engineer",
        "salaryRange": {
          "entry": { "min": 8, "max": 25 },
          "mid": { "min": 25, "max": 80 },
          "senior": { "min": 80, "max": 150 }
        },
        "demand": "high",
        "growthRate": 40,
        "skills": ["Python", "TensorFlow", "Deep Learning", "NLP", "Computer Vision"]
      }
    ]
  }
}`;

  try {
    const content = await callOpenRouterWithRetry(
      openRouter,
      [{ role: 'user', content: prompt }],
      {
        models: [AI_MODELS.GPT_4O_MINI], // Fast model for data fetching
        maxRetries: 2,
        maxTokens: 8000,
        temperature: 0.3, // Low temp for factual data
      }
    );

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[JOB MARKET] No JSON found in response');
      return {};
    }

    const data = JSON.parse(jsonMatch[0]);
    console.log('[JOB MARKET] Successfully fetched data for', Object.keys(data).length, 'categories');
    
    return data;
  } catch (error) {
    console.error('[JOB MARKET] Failed to fetch job market data:', error);
    return {};
  }
}

/**
 * Generate dynamic job recommendations section for prompt
 */
export function generateJobMarketSection(
  jobMarketData: Record<string, JobMarketData>
): string {
  if (Object.keys(jobMarketData).length === 0) {
    return '';
  }

  const sections = Object.entries(jobMarketData).map(([category, data]) => {
    const rolesText = data.roles.map(role => {
      const entryRange = `₹${role.salaryRange.entry.min}-${role.salaryRange.entry.max}L entry`;
      const midRange = `₹${role.salaryRange.mid.min}-${role.salaryRange.mid.max}L mid`;
      const seniorRange = role.salaryRange.senior 
        ? `₹${role.salaryRange.senior.min}-${role.salaryRange.senior.max}L senior`
        : '';
      
      return `  * ${role.title} (${entryRange}, ${midRange}${seniorRange ? `, ${seniorRange}` : ''})`;
    }).join('\n');

    return `**${category}** ${data.bestFor ? `(${data.bestFor})` : ''}
- **Why Better**: ${data.whyBetter || data.description}
- **Hot Roles**:
${rolesText}
- **Market Demand**: ${data.roles.filter(r => r.demand === 'high').length} HIGH demand roles, avg ${Math.round(data.roles.reduce((sum, r) => sum + r.growthRate, 0) / data.roles.length)}% growth`;
  }).join('\n\n');

  return `
## 🔥 REAL-TIME INDIAN JOB MARKET DATA (2026):

${sections}

**CRITICAL INSTRUCTIONS FOR AI:**
1. ✅ Use ONLY the salary ranges and roles from the data above
2. ✅ Use the "Why Better" descriptions to explain career cluster advantages
3. ✅ These are CURRENT 2026 market rates - do NOT use hardcoded/outdated salaries
4. ✅ Match student profile to roles with appropriate demand levels
5. ✅ Prioritize HIGH demand roles for better career prospects
6. ✅ Consider growth rate when recommending career paths
7. ✅ Copy the exact salary format: "₹X-YL entry, ₹X-YL mid, ₹X-YL senior"
8. ✅ Include the "Why Better" market insights in your career cluster descriptions

**EXAMPLE OF HOW TO USE THIS DATA:**
If the student matches "Healthcare & Wellness Coordination", you should write:
"Healthcare sector added 7.5M jobs (62% YoY growth). Entry-level roles growing 25% annually. Stable, recession-proof."
Then list the roles with their exact salary ranges from above.

DO NOT use the hardcoded examples below - they are FALLBACK ONLY if this real-time data is missing!

`;
}

/**
 * Extract career categories from student profile
 */
export function extractCareerCategories(
  riasecCode: string,
  aptitudeLevel: number,
  interests: string[]
): string[] {
  const categories: string[] = [];

  // Technology (for I, R types with high aptitude)
  if ((riasecCode.includes('I') || riasecCode.includes('R')) && aptitudeLevel >= 3) {
    categories.push('Technology & Digital Innovation');
  }

  // Business & Finance (for E, C types)
  if (riasecCode.includes('E') || riasecCode.includes('C')) {
    categories.push('Business, Finance & Consulting');
  }

  // Healthcare (for S, I types)
  if (riasecCode.includes('S') && riasecCode.includes('I')) {
    categories.push('Healthcare & Life Sciences');
  }

  // Creative (for A types)
  if (riasecCode.includes('A')) {
    categories.push('Creative Industries & Media');
  }

  // Social Impact (for S types)
  if (riasecCode.includes('S')) {
    categories.push('Healthcare & Wellness Coordination');
    categories.push('Event & Experience Management');
  }

  // Default to top 3 if none match
  if (categories.length === 0) {
    categories.push('Technology & Digital Innovation', 'Business, Finance & Consulting', 'Healthcare & Life Sciences');
  }

  // Limit to 5 categories to keep response focused
  return categories.slice(0, 5);
}
