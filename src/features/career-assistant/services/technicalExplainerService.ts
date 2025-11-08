/**
 * 📚 TECHNICAL EXPLAINER SERVICE
 * 
 * Provides clear, comprehensive explanations for ANY technology, concept, or tool.
 * Works for any domain: web dev, databases, cloud, AI, etc.
 */

import { getOpenAIClient, DEFAULT_MODEL } from './openAIClient';

export interface TechnicalExplanation {
  topic: string;
  summary: string; // Brief 1-2 sentence overview
  detailedExplanation: string; // Comprehensive explanation
  
  keyPoints: string[]; // Bullet points of key features/concepts
  
  useCases: {
    whatItsFor: string[];
    whenToUse: string;
    whenNotToUse?: string;
  };
  
  examples?: {
    description: string;
    code?: string;
    language?: string;
  }[];
  
  relatedConcepts: string[];
  nextSteps?: string; // What to explore next
}

class TechnicalExplainerService {
  
  /**
   * 📚 Explain Any Technology or Concept
   */
  async explainTechnology(
    topic: string,
    studentLevel?: 'beginner' | 'intermediate' | 'advanced',
    includeCode?: boolean
  ): Promise<TechnicalExplanation> {
    
    try {
      console.log(`📚 Technical Explainer: Explaining ${topic}...`);
      
      const prompt = `You are a technical educator. Explain this technology/concept clearly and comprehensively.

**TOPIC TO EXPLAIN:** ${topic}

**STUDENT LEVEL:** ${studentLevel || 'intermediate'}

**YOUR EXPLANATION SHOULD INCLUDE:**

1️⃣ **Summary** (1-2 sentences)
   - What is it in simple terms?
   - The "elevator pitch" explanation

2️⃣ **Detailed Explanation** (2-3 paragraphs)
   - What is it really?
   - How does it work?
   - Why does it exist/what problem does it solve?
   - Key characteristics

3️⃣ **Key Points** (5-7 bullet points)
   - Main features
   - Important concepts
   - What makes it special
   - Technical details that matter

4️⃣ **Use Cases**
   - whatItsFor: Array of 3-5 specific use cases
   - whenToUse: When should someone use this?
   - whenNotToUse: When is it NOT the right choice? (optional)

5️⃣ **Examples** (if applicable)
   ${includeCode ? '- Include practical code examples' : '- Include real-world examples'}
   - Show how it's used
   - Make it concrete

6️⃣ **Related Concepts** (3-5 items)
   - Technologies that work with this
   - Alternative options
   - What to learn next

7️⃣ **Next Steps** (optional)
   - What should student explore after understanding this?

**GUIDELINES:**
- For ${studentLevel || 'intermediate'} level: ${this.getLevelGuidance(studentLevel || 'intermediate')}
- Be CLEAR and PRACTICAL
- Use analogies when helpful
- Avoid jargon (or explain it)
- Make it actionable

**OUTPUT (JSON):**
{
  "topic": "${topic}",
  "summary": "Brief 1-2 sentence overview",
  "detailedExplanation": "Comprehensive explanation in 2-3 paragraphs",
  "keyPoints": [
    "Key point 1",
    "Key point 2",
    "Key point 3"
  ],
  "useCases": {
    "whatItsFor": [
      "Use case 1",
      "Use case 2",
      "Use case 3"
    ],
    "whenToUse": "Use when you need X, Y, and Z",
    "whenNotToUse": "Avoid when you have A or B"
  },
  "examples": [
    {
      "description": "Example description",
      "code": "code here if applicable",
      "language": "javascript"
    }
  ],
  "relatedConcepts": ["Concept 1", "Concept 2", "Concept 3"],
  "nextSteps": "After understanding this, explore..."
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a technical educator who explains complex concepts clearly. You adapt explanations to student level and always include practical examples.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });
      
      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      
      console.log('✅ Technical explanation generated');
      
      return result as TechnicalExplanation;
      
    } catch (error) {
      console.error('Technical explanation error:', error);
      throw new Error('Failed to generate explanation');
    }
  }
  
  /**
   * 📊 Compare Technologies
   */
  async compareTechnologies(
    tech1: string,
    tech2: string,
    context?: string
  ): Promise<{
    comparison: string;
    tech1Pros: string[];
    tech1Cons: string[];
    tech2Pros: string[];
    tech2Cons: string[];
    recommendation: string;
    useCaseComparison: {
      bestFor1: string[];
      bestFor2: string[];
    };
  }> {
    
    try {
      const prompt = `Compare these two technologies objectively:

**Technology 1:** ${tech1}
**Technology 2:** ${tech2}
${context ? `**Context:** ${context}` : ''}

Provide:
1. Overview comparison (what's the main difference?)
2. Pros and cons of each (be specific)
3. Use case comparison (when to use each)
4. Recommendation (which for what scenario?)

**Output (JSON):**
{
  "comparison": "Overview of how they differ",
  "tech1Pros": ["Pro 1", "Pro 2", "Pro 3"],
  "tech1Cons": ["Con 1", "Con 2"],
  "tech2Pros": ["Pro 1", "Pro 2", "Pro 3"],
  "tech2Cons": ["Con 1", "Con 2"],
  "recommendation": "Use ${tech1} when... Use ${tech2} when...",
  "useCaseComparison": {
    "bestFor1": ["Use case A", "Use case B"],
    "bestFor2": ["Use case C", "Use case D"]
  }
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: 'You provide objective technology comparisons.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });
      
      return JSON.parse(completion.choices[0]?.message?.content || '{}');
      
    } catch (error) {
      console.error('Comparison error:', error);
      throw new Error('Failed to generate comparison');
    }
  }
  
  /**
   * 🔧 How-To Guide
   */
  async generateHowToGuide(
    task: string,
    technologies: string[]
  ): Promise<{
    title: string;
    overview: string;
    prerequisites: string[];
    steps: Array<{
      step: number;
      title: string;
      description: string;
      code?: string;
      tips?: string[];
    }>;
    troubleshooting: string[];
    nextSteps: string;
  }> {
    
    try {
      const prompt = `Create a step-by-step guide for: ${task}

Technologies: ${technologies.join(', ')}

Provide:
1. Overview
2. Prerequisites
3. Step-by-step instructions (with code if applicable)
4. Common troubleshooting tips
5. What to do next

**Output (JSON):**
{
  "title": "How to ${task}",
  "overview": "Brief overview of what we'll accomplish",
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "steps": [
    {
      "step": 1,
      "title": "Step title",
      "description": "What to do",
      "code": "code example if needed",
      "tips": ["Tip 1", "Tip 2"]
    }
  ],
  "troubleshooting": ["Common issue 1 and fix", "Common issue 2 and fix"],
  "nextSteps": "After completing this, you can..."
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: 'You create clear, actionable step-by-step guides.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });
      
      return JSON.parse(completion.choices[0]?.message?.content || '{}');
      
    } catch (error) {
      console.error('How-to guide error:', error);
      throw new Error('Failed to generate guide');
    }
  }
  
  /**
   * Get level-specific guidance
   */
  private getLevelGuidance(level: string): string {
    switch (level) {
      case 'beginner':
        return 'Use simple language, explain basics, include lots of analogies';
      case 'intermediate':
        return 'Assume basic knowledge, focus on practical use, include examples';
      case 'advanced':
        return 'Technical depth, architecture details, optimization tips';
      default:
        return 'Balanced approach with practical examples';
    }
  }
}

export default new TechnicalExplainerService();
