/**
 * Project Blueprint Service
 * Generates complete, actionable project plans with architecture,
 * database schema, API design, and step-by-step implementation guide
 */

import { getOpenAIClient, DEFAULT_MODEL } from './openAIClient';

export interface ProjectBlueprint {
  name: string;
  description: string;
  domain: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedWeeks: number;
  
  // Complete Technical Specification
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    authentication: string[];
    deployment: string[];
    additional: string[];
  };
  
  // Architecture & Design
  architecture: {
    pattern: string;
    components: string[];
    dataFlow: string;
  };
  
  // Database Design
  databaseSchema: {
    tables: Array<{
      name: string;
      fields: Array<{
        name: string;
        type: string;
        constraints: string;
      }>;
      relationships: string[];
    }>;
  };
  
  // API Design
  apiEndpoints: Array<{
    method: string;
    path: string;
    description: string;
    auth: boolean;
  }>;
  
  // Features Breakdown
  features: {
    mvp: string[];          // Minimum Viable Product
    advanced: string[];     // Nice-to-have features
    bonus: string[];        // Extra impressive features
  };
  
  // Implementation Guide
  implementationPlan: Array<{
    phase: string;
    tasks: string[];
    duration: string;
    skills: string[];
  }>;
  
  // File Structure
  fileStructure: string;
  
  // Learning Outcomes
  learningOutcomes: string[];
  
  // Deployment Guide
  deploymentSteps: string[];
}

export interface SkillGapAnalysis {
  requiredSkills: string[];
  studentHasSkills: string[];
  missingSkills: string[];
  criticalMissingSkills: string[];
  estimatedLearningTime: string;
  personalizedDifficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  prerequisites: string[];
}

class ProjectBlueprintService {
  /**
   * Generate Complete Project Blueprint
   * Returns a detailed, actionable project plan
   */
  async generateBlueprint(
    projectIdea: string,
    domain: string,
    studentSkills: string[],
    industryKnowledge?: any
  ): Promise<ProjectBlueprint> {
    try {
      const prompt = `You are a senior software architect and technical mentor. Generate a COMPLETE, ACTIONABLE project blueprint.

**Project Idea:** ${projectIdea}
**Domain:** ${domain}
**Student Skills:** ${studentSkills.join(', ') || 'Beginner'}
${industryKnowledge ? `
**Industry Context:**
- Common Problems: ${industryKnowledge.commonProblems?.slice(0, 3).join(', ')}
- Industry Tech: ${industryKnowledge.popularTechnologies?.slice(0, 3).join(', ')}
- Compliance: ${industryKnowledge.complianceRequirements?.[0] || 'General best practices'}
` : ''}

**Generate a COMPREHENSIVE blueprint that includes:**

1. **Tech Stack** (specific versions preferred)
   - Frontend framework & libraries
   - Backend framework & runtime
   - Database (SQL/NoSQL choice justified)
   - Authentication solution
   - Deployment platform
   - Additional tools (state management, API client, etc.)

2. **Architecture** (be specific)
   - Architectural pattern (MVC, Clean Architecture, etc.)
   - Key components and their responsibilities
   - Data flow between components

3. **Database Schema** (detailed)
   - All necessary tables
   - Field names with data types
   - Primary keys, foreign keys
   - Indexes for performance
   - Relationships explained

4. **API Endpoints** (RESTful or GraphQL)
   - HTTP methods and paths
   - Request/response structure
   - Authentication requirements
   - At least 8-12 endpoints for a complete app

5. **Features Breakdown**
   - MVP features (must-have for v1.0)
   - Advanced features (v2.0)
   - Bonus features (portfolio wow-factor)

6. **Implementation Plan** (step-by-step)
   - Phase 1: Setup & Core (Week 1)
   - Phase 2: Features (Week 2-3)
   - Phase 3: Polish & Deploy (Week 4)
   - Each phase with specific tasks

7. **File Structure** (actual folder/file organization)
   - Show src/ structure
   - Component organization
   - Where to put what

8. **Learning Outcomes** (what student gains)
   - Technical skills learned
   - Concepts mastered
   - Portfolio value

9. **Deployment Steps** (production-ready)
   - Environment setup
   - Build process
   - Deployment platform steps
   - DNS and custom domain (if applicable)

**IMPORTANT:**
- Make it ACTIONABLE - student can start building TODAY
- Use student's existing skills: ${studentSkills.join(', ')}
- ${domain} industry-specific requirements
- Production-ready practices
- Modern, 2024-2025 best practices

**Output Format (JSON only):**
{
  "name": "ProjectName",
  "description": "What it does (2-3 sentences)",
  "domain": "${domain}",
  "difficulty": "Intermediate",
  "estimatedWeeks": 4,
  "techStack": {
    "frontend": ["React 18", "TailwindCSS"],
    "backend": ["Node.js", "Express"],
    "database": ["PostgreSQL", "Prisma ORM"],
    "authentication": ["Supabase Auth", "JWT"],
    "deployment": ["Vercel (Frontend)", "Railway (Backend)"],
    "additional": ["React Query", "Axios", "React Hook Form"]
  },
  "architecture": {
    "pattern": "Client-Server with RESTful API",
    "components": ["React Components", "API Layer", "Database Layer", "Auth Middleware"],
    "dataFlow": "Client → API → Database → API → Client"
  },
  "databaseSchema": {
    "tables": [
      {
        "name": "users",
        "fields": [
          {"name": "id", "type": "UUID", "constraints": "PRIMARY KEY"},
          {"name": "email", "type": "VARCHAR(255)", "constraints": "UNIQUE NOT NULL"},
          {"name": "created_at", "type": "TIMESTAMP", "constraints": "DEFAULT NOW()"}
        ],
        "relationships": ["ONE-TO-MANY with posts"]
      }
    ]
  },
  "apiEndpoints": [
    {"method": "POST", "path": "/api/auth/register", "description": "Register new user", "auth": false},
    {"method": "POST", "path": "/api/auth/login", "description": "Login user", "auth": false},
    {"method": "GET", "path": "/api/users/me", "description": "Get current user", "auth": true}
  ],
  "features": {
    "mvp": ["User authentication", "CRUD operations", "Dashboard"],
    "advanced": ["Real-time updates", "File uploads", "Search functionality"],
    "bonus": ["Analytics dashboard", "Email notifications", "Dark mode"]
  },
  "implementationPlan": [
    {
      "phase": "Phase 1: Foundation (Week 1)",
      "tasks": ["Setup project", "Configure database", "Implement authentication"],
      "duration": "5-7 days",
      "skills": ["React setup", "Database design", "Auth implementation"]
    }
  ],
  "fileStructure": "src/\\n  components/\\n  pages/\\n  services/\\n  utils/",
  "learningOutcomes": ["Full-stack development", "Database design", "Authentication"],
  "deploymentSteps": ["Step 1", "Step 2", "Step 3"]
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a senior software architect who creates detailed, production-ready project blueprints. Every blueprint you create is actionable and follows industry best practices.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      
      console.log('📐 Blueprint Generated:', result.name);
      console.log('⏱️  Estimated Time:', result.estimatedWeeks, 'weeks');
      console.log('🛠️  Tech Stack:', Object.values(result.techStack || {}).flat().length, 'technologies');
      console.log('📊 Database Tables:', result.databaseSchema?.tables?.length || 0);
      console.log('🌐 API Endpoints:', result.apiEndpoints?.length || 0);

      return result as ProjectBlueprint;
    } catch (error) {
      console.error('Blueprint generation error:', error);
      throw new Error('Failed to generate project blueprint');
    }
  }

  /**
   * Analyze Skill Gap for Project
   * Determines personalized difficulty and prerequisites
   */
  async analyzeSkillGap(
    projectRequirements: string[],
    studentSkills: string[]
  ): Promise<SkillGapAnalysis> {
    try {
      const prompt = `Analyze skill gap for a project:

**Project Requires:** ${projectRequirements.join(', ')}
**Student Has:** ${studentSkills.join(', ') || 'No skills listed'}

**Your Task:**
1. Match student skills to requirements
2. Identify missing skills (be specific)
3. Determine which missing skills are CRITICAL vs nice-to-have
4. Estimate realistic learning time
5. Determine ACTUAL difficulty for THIS student
6. List prerequisites to learn first

**Output (JSON):**
{
  "requiredSkills": ["all skills project needs"],
  "studentHasSkills": ["skills they already have"],
  "missingSkills": ["all skills they need to learn"],
  "criticalMissingSkills": ["must-learn before starting"],
  "estimatedLearningTime": "2-3 weeks for missing skills",
  "personalizedDifficulty": "Intermediate",
  "prerequisites": ["What to learn first before starting"]
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: 'You are an educational advisor who assesses skill gaps accurately.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return result as SkillGapAnalysis;
    } catch (error) {
      console.error('Skill gap analysis error:', error);
      return {
        requiredSkills: projectRequirements,
        studentHasSkills: studentSkills,
        missingSkills: [],
        criticalMissingSkills: [],
        estimatedLearningTime: 'Unknown',
        personalizedDifficulty: 'Intermediate',
        prerequisites: []
      };
    }
  }
}

export const projectBlueprintService = new ProjectBlueprintService();
export default projectBlueprintService;
