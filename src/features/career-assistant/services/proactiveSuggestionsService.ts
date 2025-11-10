/**
 * 💡 PROACTIVE SUGGESTIONS SERVICE
 * 
 * Monitors student activity and profile changes to provide
 * intelligent suggestions WITHOUT being asked.
 * 
 * Features:
 * - Profile change detection
 * - Smart next-step suggestions
 * - Learning momentum tracking
 * - Opportunity alerts
 * - Skill-based recommendations
 */

import { getOpenAIClient, DEFAULT_MODEL } from './openAIClient';

export interface ProactiveSuggestion {
  id: string;
  type: 'skill-added' | 'project-completed' | 'milestone-reached' | 'opportunity' | 'learning-path' | 'motivation';
  trigger: string; // What caused this suggestion
  title: string;
  message: string;
  actions: Array<{
    label: string;
    query: string; // What to ask the AI
  }>;
  priority: 'high' | 'medium' | 'low';
  expiresAt?: Date;
}

export interface ProfileChangeEvent {
  type: 'skill-added' | 'skill-removed' | 'project-added' | 'training-started' | 'training-completed';
  data: any;
  timestamp: Date;
}

class ProactiveSuggestionsService {
  private lastCheckTimestamp: Map<string, Date> = new Map();
  
  /**
   * 💡 Generate Proactive Suggestions based on profile changes
   */
  async generateProactiveSuggestions(
    studentId: string,
    studentProfile: any,
    recentChanges: ProfileChangeEvent[]
  ): Promise<ProactiveSuggestion[]> {
    
    try {
      console.log('💡 Proactive: Analyzing changes and generating suggestions...');
      
      const suggestions: ProactiveSuggestion[] = [];
      
      for (const change of recentChanges) {
        const suggestion = await this.analyzeChange(change, studentProfile);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
      
      // Also check for opportunities based on current state
      const opportunitySuggestions = await this.checkForOpportunities(studentProfile);
      suggestions.push(...opportunitySuggestions);
      
      console.log(`💡 Generated ${suggestions.length} proactive suggestions`);
      
      return suggestions.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      
    } catch (error) {
      console.error('Proactive suggestions error:', error);
      return [];
    }
  }
  
  /**
   * 🔍 Analyze a specific change and generate suggestion
   */
  private async analyzeChange(
    change: ProfileChangeEvent,
    studentProfile: any
  ): Promise<ProactiveSuggestion | null> {
    
    try {
      const prompt = `You're a proactive AI coach. A student just made a profile change. Suggest what they should do NEXT.

**STUDENT PROFILE:**
Name: ${studentProfile.name}
Current Skills: ${studentProfile.profile?.technicalSkills?.map((s: any) => s.name).join(', ') || 'None'}
Department: ${studentProfile.department}

**WHAT JUST HAPPENED:**
Type: ${change.type}
Data: ${JSON.stringify(change.data)}
Time: ${change.timestamp.toISOString()}

**YOUR TASK:**
Based on this change, suggest the MOST VALUABLE next action they should take.

For each change type:
- **skill-added**: "Great! Now you can build X. Here's what to do next..."
- **project-added**: "Awesome! To maximize this, you should..."
- **training-started**: "Since you're learning X, also consider..."
- **training-completed**: "Congrats! Time to apply this. Try..."

**Guidelines:**
- Be SPECIFIC and ACTIONABLE
- Reference their existing skills
- Suggest concrete next steps
- Make it feel like a helpful nudge, not pushy

**Output (JSON):**
{
  "shouldSuggest": true,
  "title": "Now you can build healthcare apps!",
  "message": "I noticed you just added React to your skills. Combined with your interest in healthcare, you're ready to build medical dashboards or patient management systems. Want me to suggest some project ideas?",
  "actions": [
    {
      "label": "Show me project ideas",
      "query": "Suggest React healthcare projects"
    },
    {
      "label": "What else should I learn?",
      "query": "What skills pair well with React?"
    }
  ],
  "priority": "high"
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a proactive AI coach who provides timely, relevant suggestions without being asked. You celebrate achievements and guide next steps naturally.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 600,
        response_format: { type: 'json_object' }
      });
      
      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      
      if (!result.shouldSuggest) {
        return null;
      }
      
      return {
        id: `${change.type}-${Date.now()}`,
        type: change.type,
        trigger: `User ${change.type.replace('-', ' ')}`,
        title: result.title,
        message: result.message,
        actions: result.actions || [],
        priority: result.priority || 'medium',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };
      
    } catch (error) {
      console.error('Change analysis error:', error);
      return null;
    }
  }
  
  /**
   * 🎯 Check for opportunities based on current profile state
   */
  private async checkForOpportunities(
    studentProfile: any
  ): Promise<ProactiveSuggestion[]> {
    
    const suggestions: ProactiveSuggestion[] = [];
    const skills = studentProfile.profile?.technicalSkills?.map((s: any) => s.name) || [];
    const skillCount = skills.length;
    
    // Milestone suggestions
    if (skillCount === 3) {
      suggestions.push({
        id: 'milestone-3-skills',
        type: 'milestone-reached',
        trigger: 'Reached 3 skills',
        title: '🎉 You have 3 skills! Time to combine them',
        message: 'You\'ve learned 3 different skills - that\'s awesome! Now is the perfect time to build a project that uses all of them together. This will solidify your knowledge and create something impressive for your portfolio.',
        actions: [
          { label: 'Suggest a project', query: 'Suggest a project using all my skills' },
          { label: 'Show learning path', query: 'What should I learn next?' }
        ],
        priority: 'high'
      });
    }
    
    if (skillCount === 5) {
      suggestions.push({
        id: 'milestone-5-skills',
        type: 'milestone-reached',
        trigger: 'Reached 5 skills',
        title: '💪 5 skills mastered! Ready for full-stack?',
        message: 'With 5 skills under your belt, you\'re ready to build something significant. Consider a full-stack application that showcases everything you know. This is portfolio-worthy!',
        actions: [
          { label: 'Build full-stack project', query: 'Suggest full-stack project ideas' },
          { label: 'Prepare for interviews', query: 'Help me prep for interviews' }
        ],
        priority: 'high'
      });
    }
    
    // Learning momentum suggestion
    const lastActive = studentProfile.profile?.lastActive;
    if (lastActive) {
      const daysSinceActive = Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceActive > 7 && daysSinceActive < 14) {
        suggestions.push({
          id: 'momentum-reminder',
          type: 'motivation',
          trigger: 'Inactive for a week',
          title: '👋 Miss you! Ready to keep the momentum?',
          message: 'It\'s been a week since you were last active. Consistency is key to mastering tech skills. Even 20 minutes today can keep your momentum going!',
          actions: [
            { label: 'Quick practice idea', query: 'Give me a 20-minute coding challenge' },
            { label: 'Review my progress', query: 'Show my learning progress' }
          ],
          priority: 'medium'
        });
      }
    }
    
    // Skill pairing suggestions
    if (skills.includes('React') && !skills.includes('Node.js') && !skills.includes('Django')) {
      suggestions.push({
        id: 'skill-pairing-backend',
        type: 'learning-path',
        trigger: 'Has React but no backend',
        title: '🚀 Add a backend to your React skills?',
        message: 'You know React for frontend. Learning a backend framework like Node.js or Django would make you full-stack! You could build complete applications end-to-end.',
        actions: [
          { label: 'Should I learn Node.js or Django?', query: 'Node.js vs Django for React developer' },
          { label: 'Show full-stack path', query: 'Learning path to become full-stack' }
        ],
        priority: 'medium'
      });
    }
    
    return suggestions;
  }
  
  /**
   * 🎯 Generate "What's Next" Suggestion
   * Smart suggestion based on entire profile state
   */
  async generateWhatsNext(
    studentProfile: any
  ): Promise<{
    suggestion: string;
    reasoning: string;
    actions: string[];
  }> {
    
    try {
      const skills = studentProfile.profile?.technicalSkills?.map((s: any) => s.name) || [];
      const projects = studentProfile.profile?.projects?.length || 0;
      const training = studentProfile.profile?.ongoingTraining?.length || 0;
      
      const prompt = `Based on this student's profile, what should they do NEXT?

**Profile:**
- Skills: ${skills.join(', ') || 'None'}
- Projects completed: ${projects}
- Ongoing training: ${training}
- Department: ${studentProfile.department}

Give ONE clear, actionable "What's Next" suggestion.

**Output (JSON):**
{
  "suggestion": "Build a full-stack project",
  "reasoning": "You have frontend and backend skills separately. Combining them will demonstrate real-world capability.",
  "actions": ["Choose a project idea", "Set up repository", "Build MVP in 2 weeks"]
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: 'You provide clear, actionable "what\'s next" suggestions.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 400,
        response_format: { type: 'json_object' }
      });
      
      return JSON.parse(completion.choices[0]?.message?.content || '{}');
      
    } catch (error) {
      console.error('What\'s next generation error:', error);
      return {
        suggestion: 'Build a project using your skills',
        reasoning: 'Practical projects solidify learning',
        actions: ['Choose a project', 'Start building', 'Share your work']
      };
    }
  }
  
  /**
   * 📊 Track profile changes
   */
  detectProfileChanges(
    oldProfile: any,
    newProfile: any
  ): ProfileChangeEvent[] {
    const changes: ProfileChangeEvent[] = [];
    const now = new Date();
    
    // Detect skill additions
    const oldSkills = new Set(oldProfile?.profile?.technicalSkills?.map((s: any) => s.name) || []);
    const newSkills = newProfile?.profile?.technicalSkills?.map((s: any) => s.name) || [];
    
    newSkills.forEach((skill: string) => {
      if (!oldSkills.has(skill)) {
        changes.push({
          type: 'skill-added',
          data: { skill },
          timestamp: now
        });
      }
    });
    
    // Detect project additions
    const oldProjectCount = oldProfile?.profile?.projects?.length || 0;
    const newProjectCount = newProfile?.profile?.projects?.length || 0;
    
    if (newProjectCount > oldProjectCount) {
      const newProjects = newProfile.profile.projects.slice(oldProjectCount);
      newProjects.forEach((project: any) => {
        changes.push({
          type: 'project-added',
          data: { project: project.title },
          timestamp: now
        });
      });
    }
    
    return changes;
  }
}

export default new ProactiveSuggestionsService();
