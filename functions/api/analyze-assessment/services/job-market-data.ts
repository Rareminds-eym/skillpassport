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

    console.log('[JOB MARKET] 🔍 DEBUG - AI response length:', content.length);
    console.log('[JOB MARKET] 🔍 DEBUG - First 300 chars:', content.substring(0, 300));

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[JOB MARKET] ❌ No JSON found in response');
      console.error('[JOB MARKET] Full response:', content);
      return {};
    }

    const data = JSON.parse(jsonMatch[0]);
    const categoryCount = Object.keys(data).length;
    console.log('[JOB MARKET] ✅ Successfully fetched data for', categoryCount, 'categories');
    
    if (categoryCount === 0) {
      console.error('[JOB MARKET] ⚠️ WARNING: Parsed data is empty!');
    } else {
      // Log first category as sample
      const firstCategory = Object.keys(data)[0];
      const firstData = data[firstCategory];
      console.log('[JOB MARKET] 📊 Sample category:', firstCategory);
      console.log('[JOB MARKET] 📊 Sample roles count:', firstData.roles?.length || 0);
      if (firstData.roles && firstData.roles[0]) {
        console.log('[JOB MARKET] 📊 Sample role:', firstData.roles[0].title, 
          `₹${firstData.roles[0].salaryRange.entry.min}-${firstData.roles[0].salaryRange.entry.max}L`);
      }
    }
    
    return data;
  } catch (error) {
    console.error('[JOB MARKET] ❌ Failed to fetch job market data:', error);
    console.error('[JOB MARKET] Error details:', (error as Error).message);
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
 * Now uses RIASEC profile to dynamically determine relevant categories
 */
export function extractCareerCategories(
  riasecCode: string,
  aptitudeLevel: number,
  interests: string[]
): string[] {
  const categories: string[] = [];
  
  // Parse RIASEC code (e.g., "ASR" -> ['A', 'S', 'R'])
  const riasecTypes = riasecCode.split('').slice(0, 3);
  
  console.log('[JOB MARKET] Analyzing RIASEC profile:', riasecCode);
  console.log('[JOB MARKET] Top 3 types:', riasecTypes.join(', '));
  
  // RIASEC to Career Category Mapping
  const riasecMapping: Record<string, string[]> = {
    'R': ['Engineering & Infrastructure', 'Agriculture & Food Tech', 'Healthcare & Life Sciences'],
    'I': ['Technology & Digital Innovation', 'Research & Academia', 'Healthcare & Life Sciences'],
    'A': ['Creative Industries & Media', 'Gaming & Esports', 'Performing Arts & Entertainment'],
    'S': ['Healthcare & Wellness Coordination', 'Education & Training', 'Event & Experience Management'],
    'E': ['Business, Finance & Consulting', 'Event & Experience Management', 'Sales & Account Management'],
    'C': ['Business, Finance & Consulting', 'Technology & Digital Innovation', 'Engineering & Infrastructure']
  };
  
  // Add categories based on RIASEC profile (prioritize top types)
  riasecTypes.forEach((type, index) => {
    const weight = 3 - index; // First type gets weight 3, second gets 2, third gets 1
    const typeCategories = riasecMapping[type] || [];
    
    console.log(`[JOB MARKET] Type ${type} (weight ${weight}):`, typeCategories.join(', '));
    
    typeCategories.forEach(category => {
      if (!categories.includes(category)) {
        categories.push(category);
      }
    });
  });
  
  // Special combinations for better matching
  const combo = riasecTypes.join('');
  
  // Artistic + Social combinations
  if (combo.includes('A') && combo.includes('S')) {
    if (!categories.includes('Event & Experience Management')) {
      categories.push('Event & Experience Management');
    }
    if (!categories.includes('Digital Content & Community Management')) {
      categories.push('Digital Content & Community Management');
    }
  }
  
  // Investigative + Realistic combinations (STEM)
  if (combo.includes('I') && combo.includes('R')) {
    if (!categories.includes('Technology & Digital Innovation')) {
      categories.unshift('Technology & Digital Innovation'); // Add to front
    }
  }
  
  // Social + Enterprising combinations
  if (combo.includes('S') && combo.includes('E')) {
    if (!categories.includes('Sales & Account Management')) {
      categories.push('Sales & Account Management');
    }
  }
  
  // Adjust based on aptitude level
  if (aptitudeLevel >= 4) {
    // High aptitude - add competitive/prestigious paths
    if (!categories.includes('Law & Governance')) {
      categories.push('Law & Governance');
    }
    if (!categories.includes('Civil Services & Government')) {
      categories.push('Civil Services & Government');
    }
  }
  
  // Limit to top 5 categories to keep response focused
  const finalCategories = categories.slice(0, 5);
  
  console.log('[JOB MARKET] Final categories selected:', finalCategories.join(', '));
  
  return finalCategories;
}
