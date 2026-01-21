/**
 * 🎓 ADAPTIVE LEARNING PATH SERVICE
 *
 * Features:
 * - Tracks student progress over time
 * - Adjusts difficulty dynamically based on performance
 * - Creates personalized learning trajectories
 * - Identifies learning patterns and struggles
 * - Recommends next best steps based on mastery
 */

import { getOpenAIClient, DEFAULT_MODEL } from './openAIClient';

export interface LearningProgress {
  studentId: string;
  skillProgression: Array<{
    skill: string;
    startDate: Date;
    currentLevel: 'beginner' | 'learning' | 'intermediate' | 'proficient' | 'expert';
    masteryScore: number; // 0-100
    timeSpent: number; // hours
    projectsCompleted: number;
    strugglingAreas: string[];
  }>;
  learningVelocity: 'slow' | 'steady' | 'fast'; // How quickly they learn
  learningStyle: 'visual' | 'hands-on' | 'reading' | 'mixed';
  consistencyScore: number; // 0-100
  lastActive: Date;
}

export interface AdaptivePath {
  currentStage: string;
  recommendedDifficulty: 'beginner' | 'intermediate' | 'advanced';
  nextSteps: Array<{
    step: string;
    reason: string;
    estimatedTime: string;
    resources: string[];
  }>;
  milestones: Array<{
    title: string;
    skills: string[];
    completionCriteria: string;
    estimatedWeeks: number;
  }>;
  adjustmentReason: string; // Why this path was chosen
}

class AdaptiveLearningService {
  /**
   * 📊 Generate Adaptive Learning Path
   * Creates a personalized path based on current progress and learning patterns
   */
  async generateAdaptivePath(
    studentProfile: any,
    learningProgress?: LearningProgress,
    goals?: string[]
  ): Promise<AdaptivePath> {
    try {
      console.log('🎓 Adaptive Learning: Generating personalized path...');

      const skills = studentProfile.profile?.technicalSkills?.map((s: any) => s.name) || [];
      const skillCount = skills.length;

      const prompt = `You are an adaptive learning AI that creates PERSONALIZED learning paths based on student progress and patterns.

**STUDENT PROFILE:**
Name: ${studentProfile.name}
Current Skills: ${skills.join(', ') || 'Beginner'}
Skill Count: ${skillCount}
Department: ${studentProfile.department}

${
  learningProgress
    ? `
**LEARNING ANALYTICS:**
Learning Velocity: ${learningProgress.learningVelocity}
Learning Style: ${learningProgress.learningStyle}
Consistency: ${learningProgress.consistencyScore}/100
Last Active: ${learningProgress.lastActive}

**SKILL PROGRESSION:**
${learningProgress.skillProgression
  .map(
    (sp) =>
      `- ${sp.skill}: ${sp.currentLevel} (${sp.masteryScore}% mastery, ${sp.projectsCompleted} projects, ${sp.timeSpent}h spent)
   ${sp.strugglingAreas.length > 0 ? `  Struggling with: ${sp.strugglingAreas.join(', ')}` : ''}`
  )
  .join('\n')}
`
    : 'No learning history available'
}

${goals ? `**STUDENT GOALS:** ${goals.join(', ')}` : ''}

**YOUR TASK:**
Create an ADAPTIVE learning path that:

1️⃣ **Assesses Current Stage**
   - Where are they NOW in their learning journey?
   - Beginner (0-2 skills) / Intermediate (3-7 skills) / Advanced (8+ skills)
   - Consider their actual mastery, not just skill count

2️⃣ **Determines Right Difficulty**
   - NOT too easy (boring, waste time)
   - NOT too hard (frustrating, give up)
   - JUST RIGHT (challenging but achievable)
   
   Factors to consider:
   - Their learning velocity: ${learningProgress?.learningVelocity || 'steady'}
   - Consistency: ${learningProgress?.consistencyScore || 50}/100
   - Recent struggles or successes
   - Time availability

3️⃣ **Personalized Next Steps** (4-6 actionable steps)
   - SPECIFIC to their situation
   - Build on existing skills (not random topics)
   - Address struggling areas if any
   - Quick wins + challenging goals
   - Each step with: action, reason, time estimate, resources

4️⃣ **Progressive Milestones** (3-4 milestones over 8-12 weeks)
   - Clear completion criteria
   - Skills to master per milestone
   - Realistic timelines
   - Build momentum

5️⃣ **Adjustment Reasoning**
   - WHY this specific path for THIS student
   - What makes it personalized
   - How it adapts to their patterns

**ADAPTIVE PRINCIPLES:**
${learningProgress?.learningVelocity === 'fast' ? '- Student learns FAST → More challenging content, faster progression' : ''}
${learningProgress?.learningVelocity === 'slow' ? '- Student learns SLOWLY → Break down into smaller steps, more practice' : ''}
${learningProgress?.consistencyScore && learningProgress.consistencyScore < 50 ? '- LOW consistency → Shorter, achievable goals to build habit' : ''}
${learningProgress?.consistencyScore && learningProgress.consistencyScore > 80 ? '- HIGH consistency → Can handle long-term ambitious goals' : ''}
${learningProgress?.learningStyle === 'hands-on' ? '- Hands-on learner → More projects, less theory' : ''}
${learningProgress?.learningStyle === 'visual' ? '- Visual learner → Include diagrams, videos, visual resources' : ''}

**OUTPUT (JSON):**
{
  "currentStage": "Intermediate - Building proficiency",
  "recommendedDifficulty": "intermediate",
  "nextSteps": [
    {
      "step": "Master React Hooks deeply",
      "reason": "You know basic React but struggling with hooks. Mastering this unlocks advanced patterns.",
      "estimatedTime": "1-2 weeks",
      "resources": ["React docs on Hooks", "Build 3 projects using hooks", "Hooks video course"]
    },
    {
      "step": "Build a full-stack project",
      "reason": "You have frontend and backend skills separately. Time to combine them for real-world experience.",
      "estimatedTime": "3-4 weeks",
      "resources": ["Combine React + Node.js", "Deploy to production", "Add authentication"]
    }
  ],
  "milestones": [
    {
      "title": "Hook Master",
      "skills": ["useState", "useEffect", "useContext", "Custom hooks"],
      "completionCriteria": "Build 3 apps using different hooks patterns",
      "estimatedWeeks": 2
    },
    {
      "title": "Full-Stack Developer",
      "skills": ["REST API design", "Database integration", "Deployment"],
      "completionCriteria": "Deploy 1 complete full-stack app to production",
      "estimatedWeeks": 4
    },
    {
      "title": "Production Ready",
      "skills": ["Testing", "CI/CD", "Performance optimization", "Security"],
      "completionCriteria": "App with tests, CI/CD pipeline, and best practices",
      "estimatedWeeks": 3
    }
  ],
  "adjustmentReason": "Based on your intermediate skill level and hands-on learning style, this path focuses on practical projects over theory. Your high consistency (85%) means you can handle ambitious 3-month goals. The struggling areas in hooks are addressed early before moving to full-stack work."
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are an adaptive learning AI that creates personalized, dynamic learning paths. You adjust difficulty and pacing based on individual student patterns. You are data-driven and educational.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

      console.log('🎓 Adaptive Path Generated');
      console.log('📍 Current Stage:', result.currentStage);
      console.log('📊 Difficulty:', result.recommendedDifficulty);
      console.log('🎯 Next Steps:', result.nextSteps?.length || 0);
      console.log('🏆 Milestones:', result.milestones?.length || 0);

      return result as AdaptivePath;
    } catch (error) {
      console.error('Adaptive path generation error:', error);
      throw new Error('Failed to generate adaptive learning path');
    }
  }

  /**
   * 📈 Analyze Learning Progress
   * Tracks how student is progressing and identifies patterns
   */
  async analyzeLearningPatterns(
    studentId: string,
    recentActivity: Array<{
      type: 'project' | 'course' | 'practice' | 'question';
      topic: string;
      date: Date;
      completed: boolean;
      timeSpent?: number;
    }>
  ): Promise<{
    insights: string[];
    strengths: string[];
    strugglingWith: string[];
    recommendation: string;
  }> {
    try {
      const prompt = `Analyze student learning patterns from recent activity:

**RECENT ACTIVITY (last 30 days):**
${recentActivity
  .map(
    (a) =>
      `- ${a.type}: ${a.topic} (${a.completed ? 'Completed' : 'Incomplete'}) - ${a.date.toLocaleDateString()}`
  )
  .join('\n')}

Analyze:
1. What patterns do you see?
2. What are they good at?
3. Where are they struggling?
4. What's the key recommendation?

**Output (JSON):**
{
  "insights": ["Pattern 1", "Pattern 2"],
  "strengths": ["Strength 1", "Strength 2"],
  "strugglingWith": ["Area 1", "Area 2"],
  "recommendation": "Key recommendation based on patterns"
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You analyze learning patterns to provide actionable insights.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(completion.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Pattern analysis error:', error);
      throw new Error('Failed to analyze learning patterns');
    }
  }

  /**
   * 🎯 Calculate Next Best Step
   * Determines the single most impactful next action
   */
  calculateNextBestStep(
    currentSkills: string[],
    goals: string[],
    strugglingWith: string[]
  ): {
    action: string;
    impact: 'high' | 'medium' | 'low';
    reasoning: string;
  } {
    // If struggling with something, fix that first
    if (strugglingWith.length > 0) {
      return {
        action: `Master ${strugglingWith[0]} before moving forward`,
        impact: 'high',
        reasoning: 'Addressing struggles prevents knowledge gaps and builds confidence',
      };
    }

    // If few skills, focus on fundamentals
    if (currentSkills.length < 3) {
      return {
        action: 'Build strong fundamentals with 2-3 small projects',
        impact: 'high',
        reasoning: 'Solid foundation is crucial for long-term success',
      };
    }

    // If decent skills, time for integration
    if (currentSkills.length >= 3 && currentSkills.length < 7) {
      return {
        action: 'Build a full-stack project combining all your skills',
        impact: 'high',
        reasoning: 'Integration projects demonstrate real-world capability',
      };
    }

    // If advanced, specialize or deploy
    return {
      action: 'Specialize in a domain or contribute to open source',
      impact: 'high',
      reasoning: 'Specialization and real-world contribution set you apart',
    };
  }
}

export default new AdaptiveLearningService();
