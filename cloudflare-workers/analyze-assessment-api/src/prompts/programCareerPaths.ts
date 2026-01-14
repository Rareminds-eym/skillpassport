/**
 * Program Career Paths Generator
 * Generates AI-powered career paths for degree programs based on student profile
 */

export interface StudentProfile {
  programName: string;
  programCategory: string; // Science, Commerce, Arts
  programStream: string; // science, commerce, arts
  riasecScores: {
    R: number;
    I: number;
    A: number;
    S: number;
    E: number;
    C: number;
  };
  aptitudeScores?: {
    verbal?: number;
    numerical?: number;
    abstract?: number;
    spatial?: number;
    clerical?: number;
  };
  topSkills?: string[];
  interests?: string[];
  projects?: Array<{ title: string; description?: string }>;
  experiences?: Array<{ role: string; organization?: string }>;
}

export interface CareerPath {
  role: string;
  salary: {
    min: number;
    max: number;
  };
  matchScore: number;
  whyItFits: string;
  requiredSkills: string[];
  growthPotential: string;
}

/**
 * Build prompt for generating career paths for a specific program
 */
export function buildProgramCareerPathsPrompt(profile: StudentProfile): string {
  const { programName, programCategory, programStream, riasecScores, aptitudeScores, topSkills, interests, projects, experiences } = profile;

  // Calculate dominant RIASEC types
  const riasecEntries = Object.entries(riasecScores).sort((a, b) => b[1] - a[1]);
  const topRiasec = riasecEntries.slice(0, 3).map(([type]) => type).join(', ');
  const riasecScoresStr = riasecEntries.map(([type, score]) => `${type}: ${score}`).join(', ');

  // Format aptitude scores
  const aptitudeStr = aptitudeScores 
    ? Object.entries(aptitudeScores)
        .filter(([_, score]) => score !== undefined)
        .map(([type, score]) => `${type}: ${score}%`)
        .join(', ')
    : 'Not available';

  // Format skills
  const skillsStr = topSkills && topSkills.length > 0 
    ? topSkills.join(', ') 
    : 'Not specified';

  // Format interests
  const interestsStr = interests && interests.length > 0 
    ? interests.join(', ') 
    : 'Not specified';

  // Format projects
  const projectsStr = projects && projects.length > 0
    ? projects.map(p => `- ${p.title}${p.description ? ': ' + p.description : ''}`).join('\n')
    : 'No projects listed';

  // Format experiences
  const experiencesStr = experiences && experiences.length > 0
    ? experiences.map(e => `- ${e.role}${e.organization ? ' at ' + e.organization : ''}`).join('\n')
    : 'No experience listed';

  return `You are a career counselor specializing in program-specific career guidance. Generate personalized career paths for a student pursuing ${programName}.

## STUDENT PROFILE

**Program**: ${programName}
**Category**: ${programCategory}
**Stream**: ${programStream}

**RIASEC Scores** (Career Interests):
${riasecScoresStr}
**Top 3 Types**: ${topRiasec}

**Aptitude Scores**:
${aptitudeStr}

**Top Skills**: ${skillsStr}

**Interests**: ${interestsStr}

**Projects**:
${projectsStr}

**Experience**:
${experiencesStr}

---

## TASK

Generate **3-5 career paths** that are:
1. **Directly related** to ${programName}
2. **Personalized** based on the student's RIASEC scores, aptitudes, and skills
3. **Realistic** with accurate salary ranges in Indian market (in Lakhs per annum)
4. **Diverse** covering different specializations within the program

## CAREER PATH SELECTION RULES

### For Science Programs (B.Tech, BCA, B.Sc, MBBS):
- **High I (Investigative)**: Research roles, Data Science, R&D positions
- **High R (Realistic)**: Engineering roles, Hands-on technical positions
- **High I + R**: Software Engineering, Systems Engineering, Technical Architecture
- **High I + S**: Healthcare, Biomedical Engineering, User Research
- **High I + E**: Product Management, Tech Entrepreneurship, Engineering Management
- **High I + C**: Data Engineering, Quality Assurance, Systems Analysis

### For Commerce Programs (BBA, B.Com):
- **High E (Enterprising)**: Business Development, Entrepreneurship, Sales Management
- **High C (Conventional)**: Accounting, Auditing, Financial Planning
- **High E + C**: Finance, Investment Banking, Business Management
- **High E + S**: Marketing, HR Management, Client Relations
- **High E + A**: Brand Management, Creative Direction, Advertising
- **High I + E**: Financial Analysis, Market Research, Business Analytics

### For Arts Programs (BA, LLB):
- **High A (Artistic)**: Content Creation, Design, Creative Writing
- **High S (Social)**: Counseling, Social Work, Teaching
- **High A + S**: Psychology, Therapy, Community Development
- **High I + E**: Policy Analysis, Journalism, Research
- **High E + S**: Public Relations, Event Management, NGO Leadership
- **High C + I**: Legal Services, Documentation, Compliance

## SALARY GUIDELINES (Indian Market - Lakhs per annum)

**Entry Level (0-2 years)**:
- Tech/Engineering: ₹3-8L
- Healthcare: ₹4-10L
- Business/Commerce: ₹3-7L
- Creative/Arts: ₹2-6L

**Mid Level (3-7 years)**:
- Tech/Engineering: ₹8-25L
- Healthcare: ₹10-50L
- Business/Commerce: ₹7-20L
- Creative/Arts: ₹6-15L

**Senior Level (8+ years)**:
- Tech/Engineering: ₹25-100L
- Healthcare: ₹50-200L
- Business/Commerce: ₹20-100L
- Creative/Arts: ₹15-50L

## OUTPUT FORMAT

Return ONLY a valid JSON array with this structure (no markdown, no extra text):

[
  {
    "role": "<Specific job title>",
    "salary": {
      "min": <number in Lakhs>,
      "max": <number in Lakhs>
    },
    "matchScore": <70-95>,
    "whyItFits": "<2-3 sentences explaining why this role fits THIS student's profile based on their RIASEC scores, aptitudes, and skills>",
    "requiredSkills": ["<skill 1>", "<skill 2>", "<skill 3>"],
    "growthPotential": "<1-2 sentences about career progression and future opportunities>"
  }
]

## CRITICAL REQUIREMENTS

1. **Generate 3-5 career paths** (minimum 3, maximum 5)
2. **Match scores** should range from 70-95% based on how well the role aligns with student's profile
3. **Personalization is KEY**: The "whyItFits" field MUST reference the student's actual RIASEC scores, aptitudes, or skills
4. **Salary ranges** must be realistic for the Indian market
5. **Role names** must be specific (e.g., "Full Stack Developer" not just "Developer")
6. **Required skills** should be 3-5 technical/soft skills needed for the role
7. **Growth potential** should mention career progression (e.g., "Can progress to Senior Engineer → Tech Lead → Engineering Manager")

## EXAMPLES

### Example 1: B.Tech Student with High I (85%) + High R (75%)
\`\`\`json
[
  {
    "role": "Software Engineer",
    "salary": { "min": 8, "max": 35 },
    "matchScore": 92,
    "whyItFits": "Your high Investigative (85%) and Realistic (75%) scores indicate strong analytical thinking and hands-on problem-solving abilities, perfect for software engineering. Your numerical aptitude (85%) supports coding and algorithm design.",
    "requiredSkills": ["Programming (Python/Java)", "Data Structures", "Problem Solving", "System Design", "Version Control"],
    "growthPotential": "Progress from Junior Engineer → Senior Engineer → Tech Lead → Engineering Manager. High demand with 15-20% annual growth in tech sector."
  }
]
\`\`\`

### Example 2: BBA Student with High E (88%) + High C (80%)
\`\`\`json
[
  {
    "role": "Financial Analyst",
    "salary": { "min": 6, "max": 20 },
    "matchScore": 89,
    "whyItFits": "Your Enterprising (88%) and Conventional (80%) scores show strong business acumen and attention to detail, ideal for financial analysis. Your numerical aptitude (78%) supports financial modeling and data analysis.",
    "requiredSkills": ["Financial Modeling", "Excel/Data Analysis", "Business Strategy", "Communication", "Market Research"],
    "growthPotential": "Advance to Senior Analyst → Finance Manager → CFO. Growing demand in fintech and corporate finance sectors."
  }
]
\`\`\`

### Example 3: BA Psychology Student with High S (90%) + High A (75%)
\`\`\`json
[
  {
    "role": "Clinical Psychologist",
    "salary": { "min": 5, "max": 25 },
    "matchScore": 93,
    "whyItFits": "Your Social (90%) and Artistic (75%) scores reflect strong empathy and creative problem-solving, essential for counseling and therapy. Your verbal aptitude (82%) supports effective communication with clients.",
    "requiredSkills": ["Active Listening", "Empathy", "Counseling Techniques", "Assessment Tools", "Communication"],
    "growthPotential": "Progress from Junior Psychologist → Senior Psychologist → Clinical Director. Can specialize in child psychology, organizational psychology, or private practice."
  }
]
\`\`\`

---

Now generate career paths for THIS student pursuing ${programName}. Remember to:
- Reference their ACTUAL RIASEC scores (${riasecScoresStr})
- Consider their aptitudes (${aptitudeStr})
- Mention their skills/interests if relevant
- Provide realistic salary ranges
- Explain WHY each role fits THEIR specific profile

Return ONLY the JSON array, no other text.`;
}

/**
 * Parse the AI response and validate career paths
 */
export function parseCareerPathsResponse(response: string): CareerPath[] {
  try {
    // Remove markdown code blocks if present
    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
    }

    const careerPaths = JSON.parse(cleanedResponse);

    // Validate structure
    if (!Array.isArray(careerPaths)) {
      throw new Error('Response is not an array');
    }

    // Validate each career path
    const validatedPaths = careerPaths.map((path: any) => {
      if (!path.role || !path.salary || !path.matchScore || !path.whyItFits) {
        throw new Error('Missing required fields in career path');
      }

      return {
        role: path.role,
        salary: {
          min: Number(path.salary.min),
          max: Number(path.salary.max)
        },
        matchScore: Number(path.matchScore),
        whyItFits: path.whyItFits,
        requiredSkills: path.requiredSkills || [],
        growthPotential: path.growthPotential || ''
      };
    });

    // Ensure we have 3-5 career paths
    if (validatedPaths.length < 3) {
      throw new Error('Insufficient career paths generated (minimum 3 required)');
    }

    return validatedPaths.slice(0, 5); // Maximum 5 paths
  } catch (error) {
    console.error('[CAREER_PATHS] Failed to parse response:', error);
    throw new Error(`Failed to parse career paths: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
